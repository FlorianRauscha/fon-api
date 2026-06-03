import { ValidationError } from "../../core/errors.js";
import { escapeXml } from "../../core/xml.js";
import { vpdgdBody } from "./schema.js";
import type { InfoDaten, VpdgdBody } from "./types.js";
import { VPDGD_NATIONAL_NAMESPACE, VPDGD_OECD_NAMESPACE } from "./types.js";

function infoXml(i: InfoDaten): string {
	return [
		"<Info_Daten>",
		`<Fastnr_Fon_Tn>${escapeXml(i.fastnrFonTn)}</Fastnr_Fon_Tn>`,
		`<Fastnr_Org>${escapeXml(i.fastnrOrg)}</Fastnr_Org>`,
		`<Vers>${escapeXml(i.vers)}</Vers>`,
		"</Info_Daten>",
	].join("");
}

export interface BuildOptions {
	validate?: boolean;
}

export function build(body: VpdgdBody, opts: BuildOptions = {}): string {
	if (opts.validate !== false) {
		const result = vpdgdBody.safeParse(body);
		if (!result.success) {
			throw new ValidationError(
				"VPDGD body failed validation",
				result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
			);
		}
	}
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		`<Cbc_National xmlns="${VPDGD_NATIONAL_NAMESPACE}" xmlns:cbc="${VPDGD_OECD_NAMESPACE}">`,
		infoXml(body.info),
		body.cbcOecdInner,
		"</Cbc_National>",
	].join("");
}
