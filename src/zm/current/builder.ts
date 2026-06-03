import { ValidationError } from "../../core/errors.js";
import { escapeXml } from "../../core/xml.js";
import { zmBody } from "./schema.js";
import type {
	AllgemeineDaten,
	Erklaerung,
	Gesamtruckziehung,
	InfoDaten,
	ZMBody,
	ZmEntry,
} from "./types.js";

function infoXml(i: InfoDaten): string {
	return [
		"<INFO_DATEN>",
		`<ART_IDENTIFIKATIONSBEGRIFF>${escapeXml(i.artIdentifikationsbegriff)}</ART_IDENTIFIKATIONSBEGRIFF>`,
		`<IDENTIFIKATIONSBEGRIFF>${escapeXml(i.identifikationsbegriff)}</IDENTIFIKATIONSBEGRIFF>`,
		`<PAKET_NR>${i.paketNr}</PAKET_NR>`,
		`<DATUM_ERSTELLUNG type="datum">${escapeXml(i.datumErstellung)}</DATUM_ERSTELLUNG>`,
		`<UHRZEIT_ERSTELLUNG type="uhrzeit">${escapeXml(i.uhrzeitErstellung)}</UHRZEIT_ERSTELLUNG>`,
		`<ANZAHL_ERKLAERUNGEN>${i.anzahlErklaerungen}</ANZAHL_ERKLAERUNGEN>`,
		"</INFO_DATEN>",
	].join("");
}

function allgemeinXml(a: AllgemeineDaten): string {
	const parts = [
		`<ANBRINGEN>${escapeXml(a.anbringen)}</ANBRINGEN>`,
		`<ZRVON type="jahrmonat">${escapeXml(a.zrvon)}</ZRVON>`,
		`<ZRBIS type="jahrmonat">${escapeXml(a.zrbis)}</ZRBIS>`,
		`<FASTNR>${escapeXml(a.fastnr)}</FASTNR>`,
		a.kundeninfo !== undefined ? `<KUNDENINFO>${escapeXml(a.kundeninfo)}</KUNDENINFO>` : "",
	];
	return `<ALLGEMEINE_DATEN>${parts.join("")}</ALLGEMEINE_DATEN>`;
}

function zmEntryXml(z: ZmEntry): string {
	const parts = [
		`<UID_MS>${escapeXml(z.uidMs)}</UID_MS>`,
		z.sumBgl !== undefined ? `<SUM_BGL type="kz">${z.sumBgl}</SUM_BGL>` : "",
		z.dreieck !== undefined ? `<DREIECK>${escapeXml(z.dreieck)}</DREIECK>` : "",
		z.solei !== undefined ? `<SOLEI>${escapeXml(z.solei)}</SOLEI>` : "",
		z.klag !== undefined ? `<KLAG>${escapeXml(z.klag)}</KLAG>` : "",
		z.uidUe !== undefined ? `<UID_UE>${escapeXml(z.uidUe)}</UID_UE>` : "",
	];
	return `<ZM>${parts.join("")}</ZM>`;
}

function gesamtruckziehungXml(g: Gesamtruckziehung): string {
	return `<GESAMTRUECKZIEHUNG><GESAMTRUECK>${escapeXml(g.gesamtrueck)}</GESAMTRUECK></GESAMTRUECKZIEHUNG>`;
}

function erklaerungXml(e: Erklaerung): string {
	const inner =
		e.content.kind === "entries"
			? e.content.entries.map(zmEntryXml).join("")
			: gesamtruckziehungXml(e.content.gesamtrueckziehung);
	return `<ERKLAERUNG art="${escapeXml(e.art)}"><SATZNR>${e.satznr}</SATZNR>${allgemeinXml(e.allgemein)}${inner}</ERKLAERUNG>`;
}

export interface BuildOptions {
	validate?: boolean;
}

/**
 * Build a ZM (Zusammenfassende Meldung) `<ERKLAERUNGS_UEBERMITTLUNG>` payload.
 * Pass the output as the `data` field of a fileupload SOAP call with `art: "U13"`.
 */
export function build(body: ZMBody, opts: BuildOptions = {}): string {
	if (opts.validate !== false) {
		const result = zmBody.safeParse(body);
		if (!result.success) {
			throw new ValidationError(
				"ZM body failed validation",
				result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
			);
		}
	}
	const erklaerungen = body.erklaerungen.map(erklaerungXml).join("");
	return `<?xml version="1.0" encoding="UTF-8"?><ERKLAERUNGS_UEBERMITTLUNG>${infoXml(body.info)}${erklaerungen}</ERKLAERUNGS_UEBERMITTLUNG>`;
}
