import { MaintenanceError, NetworkError, SoapFaultError } from "./errors.js";

export interface SoapCallOptions {
	endpoint: string;
	soapAction: string;
	/** The inner Body element XML (already namespaced). */
	bodyXml: string;
	/** Injectable for tests. Defaults to global `fetch`. */
	fetch?: typeof fetch;
	signal?: AbortSignal;
	timeoutMs?: number;
}

export function buildEnvelope(bodyXml: string): string {
	return `<?xml version="1.0" encoding="UTF-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body>${bodyXml}</soap:Body></soap:Envelope>`;
}

const SOAP_BODY_RE = /<(?:\w+:)?Body[^>]*>([\s\S]*?)<\/(?:\w+:)?Body>/i;
const SOAP_FAULT_RE = /<(?:\w+:)?Fault[\s>]/i;

export function extractBody(envelopeXml: string): string {
	const m = envelopeXml.match(SOAP_BODY_RE);
	if (!m || !m[1]) throw new SoapFaultError("Response missing SOAP Body", 200, envelopeXml);
	return m[1].trim();
}

export async function soapCall(opts: SoapCallOptions): Promise<string> {
	const envelope = buildEnvelope(opts.bodyXml);
	const fetchFn = opts.fetch ?? fetch;
	const ctrl = new AbortController();
	const timeoutId =
		opts.timeoutMs !== undefined ? setTimeout(() => ctrl.abort(), opts.timeoutMs) : null;
	const signal = opts.signal ?? ctrl.signal;

	let res: Response;
	try {
		res = await fetchFn(opts.endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "text/xml; charset=utf-8",
				SOAPAction: `"${opts.soapAction}"`,
				Accept: "text/xml, application/soap+xml",
			},
			body: envelope,
			signal,
		});
	} catch (err) {
		throw new NetworkError(`Network error calling ${opts.endpoint}`, err);
	} finally {
		if (timeoutId !== null) clearTimeout(timeoutId);
	}

	const text = await res.text();
	if (text.includes("/wartung/")) throw new MaintenanceError(text);
	if (SOAP_FAULT_RE.test(text)) throw new SoapFaultError("SOAP Fault", res.status, text);
	if (!res.ok) throw new SoapFaultError(`HTTP ${res.status}`, res.status, text);
	return extractBody(text);
}
