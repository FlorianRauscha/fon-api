import { ValidationError } from "../../core/errors.js";
import { escapeXml } from "../../core/xml.js";
import { tvwBody } from "./schema.js";
import type { Benutzer, InfoDaten, Klient, Team, TvwBody } from "./types.js";

function infoXml(i: InfoDaten): string {
	return [
		"<INFO_DATEN>",
		`<ART_IDENTIFIKATIONSBEGRIFF>${escapeXml(i.artIdentifikationsbegriff)}</ART_IDENTIFIKATIONSBEGRIFF>`,
		`<IDENTIFIKATIONSBEGRIFF>${escapeXml(i.identifikationsbegriff)}</IDENTIFIKATIONSBEGRIFF>`,
		`<PAKET_NR>${i.paketNr}</PAKET_NR>`,
		`<DATUM_ERSTELLUNG type="datum">${escapeXml(i.datumErstellung)}</DATUM_ERSTELLUNG>`,
		`<UHRZEIT_ERSTELLUNG type="uhrzeit">${escapeXml(i.uhrzeitErstellung)}</UHRZEIT_ERSTELLUNG>`,
		`<ANZAHL_TEAM>${i.anzahlTeam}</ANZAHL_TEAM>`,
		"</INFO_DATEN>",
	].join("");
}

function benutzerXml(b: Benutzer): string {
	return `<BENUTZER><BENID aktion="${escapeXml(b.aktion)}">${escapeXml(b.benid)}</BENID></BENUTZER>`;
}

function klientXml(k: Klient): string {
	return `<KLIENT><FASTNR aktion="${escapeXml(k.aktion)}">${escapeXml(k.fastnr)}</FASTNR></KLIENT>`;
}

function teamXml(t: Team): string {
	const parts = [
		`<SATZNR>${t.satznr}</SATZNR>`,
		`<ANBRINGEN>${escapeXml(t.anbringen)}</ANBRINGEN>`,
		`<TEAMNAME aktion="${escapeXml(t.teamname.aktion)}">${escapeXml(t.teamname.value)}</TEAMNAME>`,
		(t.benutzer ?? []).map(benutzerXml).join(""),
		(t.klient ?? []).map(klientXml).join(""),
	];
	return `<TEAM art="${escapeXml(t.art)}">${parts.join("")}</TEAM>`;
}

export interface BuildOptions {
	validate?: boolean;
}

export function build(body: TvwBody, opts: BuildOptions = {}): string {
	if (opts.validate !== false) {
		const result = tvwBody.safeParse(body);
		if (!result.success) {
			throw new ValidationError(
				"TVW body failed validation",
				result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
			);
		}
	}
	return `<?xml version="1.0" encoding="UTF-8"?><TEAM_UEBERMITTLUNG>${infoXml(body.info)}${teamXml(body.team)}</TEAM_UEBERMITTLUNG>`;
}
