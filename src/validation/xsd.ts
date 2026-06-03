/**
 * Map an upload art (with optional version) to its bundled XSD path, and run
 * `xmllint --schema` against a candidate XML payload.
 *
 * `xmllint` is invoked from `PATH`. If it isn't installed, `validateXml`
 * returns `{ ok: false, reason: "xmllint-missing" }` so callers can render
 * a helpful message rather than crash.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(HERE, "..", "..");

/**
 * art-to-XSD lookup. For year/effective-date versioned arts, the second
 * argument selects the version (e.g. `"2025"`, `"01_2022"`, `"v2_0"`).
 */
const XSD_BY_ART: Record<string, Record<string, string>> = {
	U30: {
		"01_2022": "schemas/u30/01_2022/BMF_ERKLAERUNGS_UEBERMITTLUNG_U30_01_2022.xsd",
		"07_2026": "schemas/u30/07_2026/BMF_ERKLAERUNGS_UEBERMITTLUNG_U30_07_2026.xsd",
	},
	L1: {
		"2021": "schemas/l1/2021/BMF_XSD_Schema_Arbeitnehmerveranlagung_2021.xsd",
		"2022": "schemas/l1/2022/BMF_XSD_Schema_Arbeitnehmerveranlagung_2022.xsd",
		"2023": "schemas/l1/2023/BMF_XSD_Schema_Arbeitnehmerveranlagung_2023.xsd",
		"2024": "schemas/l1/2024/BMF_XSD_Schema_Arbeitnehmerveranlagung_2024.xsd",
		"2025": "schemas/l1/2025/BMF_XSD_Schema_Arbeitnehmerveranlagung_2025.xsd",
	},
	JAHR_ERKL: {
		"2019": "schemas/jahr_erkl/2019/BMF_XSD_Jahreserklaerungen_2019.xsd",
		"2020": "schemas/jahr_erkl/2020/BMF_XSD_Jahreserklaerungen_2020.xsd",
		"2021": "schemas/jahr_erkl/2021/BMF_XSD_Jahreserklaerungen_2021.xsd",
		"2022": "schemas/jahr_erkl/2022/BMF_XSD_Jahreserklaerungen_2022.xsd",
		"2023": "schemas/jahr_erkl/2023/BMF_XSD_Jahreserklaerungen_2023.xsd",
		"2024": "schemas/jahr_erkl/2024/BMF_XSD_Jahreserklaerungen_2024.xsd",
		"2025": "schemas/jahr_erkl/2025/BMF_XSD_Jahreserklaerungen_2025.xsd",
	},
	KA1: {
		ab_2016: "schemas/ka1/ab_2016/BMF_XSD_Schema_Kapitalertragsteuer_Anmeldung_KA1_ab_2016.xsd",
		ab_2022: "schemas/ka1/ab_2022/BMF_XSD_Schema_Kapitalertragsteuer_Anmeldung_KA1_ab_2022.xsd",
	},
	VPDGD: {
		v2_0: "schemas/vpdgd/v2_0/Cbc_National_v2.0.xsd",
	},
	U13: { current: "schemas/zm/current/BMF_XSD_Schema_Zusammenfassende_Meldung.xsd" },
	KOM: { current: "schemas/kom/current/BMF_XSD_Schema_KommSt1_KommSt2.xsd" },
	KOMU: { current: "schemas/komu/current/BMF_XSD_Schema_Kommunalsteuerbemessungsgrundlage.xsd" },
	NOVA: { current: "schemas/nova/current/BMF_XSD_Schema_Normverbrauchsabgabe.xsd" },
	FVAN: { current: "schemas/fvan/current/BMF_XSD_Schema_Fristverlaengerung.xsd" },
	SB: { current: "schemas/sb/current/BMF_XSD_Schema_Buchung_SB.xsd" },
	SBS: { current: "schemas/sbs/current/BMF_XSD_Schema_Berichtigung_Buchung_SB.xsd" },
	SBZ: { current: "schemas/sbz/current/BMF_XSD_Schema_Meldung_SB.xsd" },
	RZ: { current: "schemas/rz/current/BMF_XSD_Schema_Rueckzahlung.xsd" },
	UEB: { current: "schemas/ueb/current/BMF_XSD_Schema_Uebertragung.xsd" },
	DIGI: { current: "schemas/digi/current/BMF_XSD_Schema_Digitalsteuer.xsd" },
	STAB: { current: "schemas/stab/current/BMF_XSD_Schema_Stabilitaetsabgabe_2017.xsd" },
	BET: { current: "schemas/bet/current/BMF_XSD_Schema_Abfragen_Beteiligte.xsd" },
	VAT: { current: "schemas/vat/current/BMF_XSD_Schema_VAT_Antrag.xsd" },
	VATAB: { current: "schemas/vat/current/BMF_XSD_Schema_VAT_Antrag_Abschluss.xsd" },
	DUE: { current: "schemas/due/current/BMF_XSD_Schema_Depotuebertragung.xsd" },
	TVW: { current: "schemas/tvw/current/BMF_XSD_Schema_Teamverwaltung.xsd" },
	SOER: { current: "schemas/soer/current/SonstigeErklaerungen.xsd" },
};

/**
 * BET and TVW ship malformed regex patterns / unsupported XSD facets that
 * libxml2 cannot compile, so XSD validation is unavailable for them. Callers
 * receive a `xsd-incompatible` reason rather than a confusing parse error.
 */
const XSD_INCOMPATIBLE = new Set(["BET", "TVW"]);

export interface XsdLookup {
	xsdAbsolutePath: string;
	xsdRelativePath: string;
}

export class UnsupportedArtError extends Error {
	constructor(public readonly art: string) {
		super(`No bundled XSD for art="${art}"`);
		this.name = "UnsupportedArtError";
	}
}

/** Resolve an art (+ optional version) to an absolute XSD path. */
export function resolveXsdPath(art: string, version?: string): XsdLookup {
	const versions = XSD_BY_ART[art];
	if (!versions) throw new UnsupportedArtError(art);
	const rel = version ? versions[version] : (versions.current ?? Object.values(versions)[0]);
	if (!rel)
		throw new Error(
			`Art "${art}" has no version "${version ?? "current"}". Available: ${Object.keys(versions).join(", ")}`,
		);
	return { xsdAbsolutePath: join(PKG_ROOT, rel), xsdRelativePath: rel };
}

/** True iff `xmllint` is callable on PATH. */
export function hasXmllint(): boolean {
	try {
		execFileSync("xmllint", ["--version"], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

export type ValidateXmlResult =
	| { ok: true; xsdPath: string }
	| { ok: false; reason: "xmllint-missing" }
	| { ok: false; reason: "xsd-incompatible"; art: string }
	| { ok: false; reason: "xsd-missing"; xsdPath: string }
	| { ok: false; reason: "validation-failed"; xsdPath: string; stderr: string };

/**
 * Validate an XML payload against the bundled XSD for the given art.
 * Writes the XML to a temp file and shells out to `xmllint --noout --schema`.
 */
export function validateXml(art: string, xml: string, version?: string): ValidateXmlResult {
	if (XSD_INCOMPATIBLE.has(art)) return { ok: false, reason: "xsd-incompatible", art };
	if (!hasXmllint()) return { ok: false, reason: "xmllint-missing" };

	const { xsdAbsolutePath } = resolveXsdPath(art, version);
	if (!existsSync(xsdAbsolutePath)) {
		return { ok: false, reason: "xsd-missing", xsdPath: xsdAbsolutePath };
	}

	const dir = mkdtempSync(join(tmpdir(), "fon-validate-"));
	const xmlPath = join(dir, "payload.xml");
	writeFileSync(xmlPath, xml, "utf8");
	try {
		execFileSync("xmllint", ["--noout", "--schema", xsdAbsolutePath, xmlPath], { stdio: "pipe" });
		return { ok: true, xsdPath: xsdAbsolutePath };
	} catch (err) {
		const e = err as { stderr?: Buffer };
		return {
			ok: false,
			reason: "validation-failed",
			xsdPath: xsdAbsolutePath,
			stderr: e.stderr?.toString() ?? "",
		};
	}
}
