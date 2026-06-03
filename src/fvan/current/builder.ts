import { ValidationError } from "../../core/errors.js";
import { escapeXml } from "../../core/xml.js";
import { fvanBody } from "./schema.js";
import type { Erklaerung, FvanBody, InfoDaten } from "./types.js";

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

function erklaerungXml(e: Erklaerung): string {
	const parts = [
		`<SATZNR>${e.satznr}</SATZNR>`,
		`<ANBRINGEN>${escapeXml(e.anbringen)}</ANBRINGEN>`,
		`<FASTNR>${escapeXml(e.fastnr)}</FASTNR>`,
		e.kundeninfo !== undefined ? `<KUNDENINFO>${escapeXml(e.kundeninfo)}</KUNDENINFO>` : "",
		`<ERKL_ZR>${escapeXml(e.erklZr)}</ERKL_ZR>`,
		`<DATFRIST type="datum">${escapeXml(e.datfrist)}</DATFRIST>`,
		`<BEGRUEND>${escapeXml(e.begruend)}</BEGRUEND>`,
	];
	return `<ERKLAERUNG art="${escapeXml(e.art)}">${parts.join("")}</ERKLAERUNG>`;
}

export interface BuildOptions {
	validate?: boolean;
}

export function build(body: FvanBody, opts: BuildOptions = {}): string {
	if (opts.validate !== false) {
		const result = fvanBody.safeParse(body);
		if (!result.success) {
			throw new ValidationError(
				"FVAN body failed validation",
				result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
			);
		}
	}
	const erklaerungen = body.erklaerungen.map(erklaerungXml).join("");
	return `<?xml version="1.0" encoding="UTF-8"?><ERKLAERUNGS_UEBERMITTLUNG>${infoXml(body.info)}${erklaerungen}</ERKLAERUNGS_UEBERMITTLUNG>`;
}
