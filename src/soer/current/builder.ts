import { ValidationError } from "../../core/errors.js";
import { escapeXml } from "../../core/xml.js";
import { soerBody } from "./schema.js";
import type { InfoDaten, MessageSpec, SoerBody, SoerEntry } from "./types.js";
import { SOER_NAMESPACE } from "./types.js";

function infoXml(i: InfoDaten): string {
	return `<Info_Daten><Fastnr_Fon_Tn>${escapeXml(i.fastnrFonTn)}</Fastnr_Fon_Tn></Info_Daten>`;
}

function messageSpecXml(m: MessageSpec): string {
	return [
		"<MessageSpec>",
		`<MessageRefId>${escapeXml(m.messageRefId)}</MessageRefId>`,
		`<Timestamp>${escapeXml(m.timestamp)}</Timestamp>`,
		"</MessageSpec>",
	].join("");
}

function soerEntryXml(s: SoerEntry): string {
	const parts = [
		`<RefNr>${escapeXml(s.refNr)}</RefNr>`,
		`<Fastnr_Org>${escapeXml(s.fastnrOrg)}</Fastnr_Org>`,
		`<Datvon>${escapeXml(s.datvon)}</Datvon>`,
		s.datbis !== undefined ? `<Datbis>${escapeXml(s.datbis)}</Datbis>` : "",
		`<Anhang>${escapeXml(s.anhang)}</Anhang>`,
	];
	return `<SOER art="${escapeXml(s.art)}">${parts.join("")}</SOER>`;
}

export interface BuildOptions {
	validate?: boolean;
}

export function build(body: SoerBody, opts: BuildOptions = {}): string {
	if (opts.validate !== false) {
		const result = soerBody.safeParse(body);
		if (!result.success) {
			throw new ValidationError(
				"SOER body failed validation",
				result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
			);
		}
	}
	const inner = [
		body.info !== undefined ? infoXml(body.info) : "",
		messageSpecXml(body.messageSpec),
		body.soer.map(soerEntryXml).join(""),
	].join("");
	return `<?xml version="1.0" encoding="UTF-8"?><SonstigeErklaerungenUebermittlung xmlns="${SOER_NAMESPACE}">${inner}</SonstigeErklaerungenUebermittlung>`;
}
