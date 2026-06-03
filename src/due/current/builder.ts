import { ValidationError } from "../../core/errors.js";
import { escapeXml } from "../../core/xml.js";
import { dueBody } from "./schema.js";
import type {
	AllgemeineDaten,
	BetroffeneWertpapier,
	DepotfuehrendeStelle,
	Depotinhaber,
	DueBody,
	Erklaerung,
	InfoDaten,
	UebertragungAuf,
} from "./types.js";

function fmtKz(n: number): string {
	const r = Math.round(n * 100) / 100;
	return (Object.is(r, -0) ? 0 : r).toFixed(2);
}

function infoXml(i: InfoDaten): string {
	return [
		"<INFO_DATEN>",
		`<ART_IDENTIFIKATIONSBEGRIFF>${escapeXml(i.artIdentifikationsbegriff)}</ART_IDENTIFIKATIONSBEGRIFF>`,
		`<IDENTIFIKATIONSBEGRIFF>${escapeXml(i.identifikationsbegriff)}</IDENTIFIKATIONSBEGRIFF>`,
		`<PAKET_NR>${i.paketNr}</PAKET_NR>`,
		`<DATUM_ERSTELLUNG type="datum">${escapeXml(i.datumErstellung)}</DATUM_ERSTELLUNG>`,
		`<UHRZEIT_ERSTELLUNG type="uhrzeit">${escapeXml(i.uhrzeitErstellung)}</UHRZEIT_ERSTELLUNG>`,
		`<ANZAHL_ERKLAERUNGEN>${i.anzahlErklaerungen}</ANZAHL_ERKLAERUNGEN>`,
		`<FASTNR_MITTEILER>${escapeXml(i.fastnrMitteiler)}</FASTNR_MITTEILER>`,
		`<NAME_MITTEILER>${escapeXml(i.nameMitteiler)}</NAME_MITTEILER>`,
		"</INFO_DATEN>",
	].join("");
}

function depotfuehrendeStelleXml(s: DepotfuehrendeStelle): string {
	return [
		"<DEPOTFUEHRENDE_STELLE>",
		`<DEP_STELLE>${escapeXml(s.depStelle)}</DEP_STELLE>`,
		`<BIC>${escapeXml(s.bic)}</BIC>`,
		"</DEPOTFUEHRENDE_STELLE>",
	].join("");
}

function allgemeinXml(a: AllgemeineDaten): string {
	const head = [
		`<ANBRINGEN>${escapeXml(a.anbringen)}</ANBRINGEN>`,
		a.kundeninfo !== undefined ? `<KUNDENINFO>${escapeXml(a.kundeninfo)}</KUNDENINFO>` : "",
		`<REFNR>${escapeXml(a.refnr)}</REFNR>`,
	];
	if (a.kind === "gesamtrueck") {
		return `<ALLGEMEINE_DATEN>${head.join("")}<GESAMTRUECK>J</GESAMTRUECK></ALLGEMEINE_DATEN>`;
	}
	const transferParts = [
		`<GESETZ>${escapeXml(a.gesetz)}</GESETZ>`,
		a.gemeinschaftsdepotD !== undefined
			? `<GEMEINSCHAFTSDEPOT_D>${escapeXml(a.gemeinschaftsdepotD)}</GEMEINSCHAFTSDEPOT_D>`
			: "",
		a.gemeinschaftsdepotA !== undefined
			? `<GEMEINSCHAFTSDEPOT_A>${escapeXml(a.gemeinschaftsdepotA)}</GEMEINSCHAFTSDEPOT_A>`
			: "",
		a.berichtigung !== undefined ? `<BERICHTIGUNG>${escapeXml(a.berichtigung)}</BERICHTIGUNG>` : "",
		`<ZEITPUNKT><DATUEB type="datum">${escapeXml(a.datueb)}</DATUEB></ZEITPUNKT>`,
		depotfuehrendeStelleXml(a.depotfuehrendeStelle),
	];
	return `<ALLGEMEINE_DATEN>${head.join("")}${transferParts.join("")}</ALLGEMEINE_DATEN>`;
}

function depotinhaberXml(d: Depotinhaber): string {
	switch (d.kind) {
		case "vnr":
			return `<DEPOTINHABER><VNR_D>${escapeXml(d.vnr)}</VNR_D></DEPOTINHABER>`;
		case "fastnr":
			return `<DEPOTINHABER><FASTNR_D>${escapeXml(d.fastnr)}</FASTNR_D></DEPOTINHABER>`;
		case "person": {
			const parts = [
				`<NNAME_D>${escapeXml(d.nname)}</NNAME_D>`,
				`<VNAME_D>${escapeXml(d.vname)}</VNAME_D>`,
				`<GEB_D type="datum">${escapeXml(d.geb)}</GEB_D>`,
				`<STR_D>${escapeXml(d.str)}</STR_D>`,
				`<NR_D>${escapeXml(d.nr)}</NR_D>`,
				d.stg !== undefined ? `<STG_D>${escapeXml(d.stg)}</STG_D>` : "",
				d.tuer !== undefined ? `<TUER_D>${escapeXml(d.tuer)}</TUER_D>` : "",
				`<PLZ_D>${escapeXml(d.plz)}</PLZ_D>`,
				`<ORT_D>${escapeXml(d.ort)}</ORT_D>`,
				`<LAND_D>${escapeXml(d.land)}</LAND_D>`,
			];
			return `<DEPOTINHABER>${parts.join("")}</DEPOTINHABER>`;
		}
		case "firma": {
			const parts = [
				`<FIRMNAME_D>${escapeXml(d.firmname)}</FIRMNAME_D>`,
				`<STR_D>${escapeXml(d.str)}</STR_D>`,
				`<NR_D>${escapeXml(d.nr)}</NR_D>`,
				d.stg !== undefined ? `<STG_D>${escapeXml(d.stg)}</STG_D>` : "",
				d.tuer !== undefined ? `<TUER_D>${escapeXml(d.tuer)}</TUER_D>` : "",
				`<PLZ_D>${escapeXml(d.plz)}</PLZ_D>`,
				`<ORT_D>${escapeXml(d.ort)}</ORT_D>`,
				`<LAND_D>${escapeXml(d.land)}</LAND_D>`,
			];
			return `<DEPOTINHABER>${parts.join("")}</DEPOTINHABER>`;
		}
	}
}

function uebertragungAufXml(u: UebertragungAuf): string {
	if (u.kind === "person") {
		const parts = [
			`<NNAME_A>${escapeXml(u.nname)}</NNAME_A>`,
			`<VNAME_A>${escapeXml(u.vname)}</VNAME_A>`,
			`<GEB_A type="datum">${escapeXml(u.geb)}</GEB_A>`,
			`<STR_A>${escapeXml(u.str)}</STR_A>`,
			`<NR_A>${escapeXml(u.nr)}</NR_A>`,
			u.stg !== undefined ? `<STG_A>${escapeXml(u.stg)}</STG_A>` : "",
			u.tuer !== undefined ? `<TUER_A>${escapeXml(u.tuer)}</TUER_A>` : "",
			`<PLZ_A>${escapeXml(u.plz)}</PLZ_A>`,
			`<ORT_A>${escapeXml(u.ort)}</ORT_A>`,
			`<LAND_A>${escapeXml(u.land)}</LAND_A>`,
		];
		return `<UEBERTRAGUNG_AUF>${parts.join("")}</UEBERTRAGUNG_AUF>`;
	}
	const parts = [
		`<FIRMNAME_A>${escapeXml(u.firmname)}</FIRMNAME_A>`,
		`<STR_A>${escapeXml(u.str)}</STR_A>`,
		`<NR_A>${escapeXml(u.nr)}</NR_A>`,
		u.stg !== undefined ? `<STG_A>${escapeXml(u.stg)}</STG_A>` : "",
		u.tuer !== undefined ? `<TUER_A>${escapeXml(u.tuer)}</TUER_A>` : "",
		`<PLZ_A>${escapeXml(u.plz)}</PLZ_A>`,
		`<ORT_A>${escapeXml(u.ort)}</ORT_A>`,
		`<LAND_A>${escapeXml(u.land)}</LAND_A>`,
	];
	return `<UEBERTRAGUNG_AUF>${parts.join("")}</UEBERTRAGUNG_AUF>`;
}

function wertpapierXml(w: BetroffeneWertpapier): string {
	const parts = [
		`<BEZ_WG>${escapeXml(w.bezWg)}</BEZ_WG>`,
		`<ISIN>${escapeXml(w.isin)}</ISIN>`,
		`<MEN>${w.men}</MEN>`,
		`<KENN_MEN>${escapeXml(w.kennMen)}</KENN_MEN>`,
		`<AK type="kz">${fmtKz(w.ak)}</AK>`,
		`<KENN_AK>${escapeXml(w.kennAk)}</KENN_AK>`,
	];
	return `<BETROFFENE_WERTPAPIERE>${parts.join("")}</BETROFFENE_WERTPAPIERE>`;
}

function erklaerungXml(e: Erklaerung): string {
	const parts = [
		allgemeinXml(e.allgemein),
		(e.depotinhaber ?? []).map(depotinhaberXml).join(""),
		(e.betroffeneWertpapiere ?? []).map(wertpapierXml).join(""),
		(e.uebertragungAuf ?? []).map(uebertragungAufXml).join(""),
	];
	return `<ERKLAERUNG art="${escapeXml(e.art)}">${parts.join("")}</ERKLAERUNG>`;
}

export interface BuildOptions {
	validate?: boolean;
}

export function build(body: DueBody, opts: BuildOptions = {}): string {
	if (opts.validate !== false) {
		const result = dueBody.safeParse(body);
		if (!result.success) {
			throw new ValidationError(
				"DUE body failed validation",
				result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
			);
		}
	}
	const erklaerungen = body.erklaerungen.map(erklaerungXml).join("");
	return `<?xml version="1.0" encoding="UTF-8"?><ERKLAERUNGS_UEBERMITTLUNG>${infoXml(body.info)}${erklaerungen}</ERKLAERUNGS_UEBERMITTLUNG>`;
}
