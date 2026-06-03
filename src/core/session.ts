import { ENDPOINTS, NAMESPACES, SOAP_ACTIONS } from "./endpoints.js";
import { InvalidXmlError } from "./errors.js";
import { rcToError } from "./returncodes.js";
import { soapCall } from "./soap.js";
import { el, parseXml } from "./xml.js";

export interface Credentials {
	tid: string;
	benid: string;
	pin: string;
	herstellerid: string;
}

export interface SessionLogin {
	tid: string;
	benid: string;
	id: string;
}

export interface SessionTransport {
	endpoint?: string;
	fetch?: typeof fetch;
	timeoutMs?: number;
}

interface LoginResponseXml {
	loginResponse?: { id?: string; rc?: string; msg?: string };
}

interface LogoutResponseXml {
	logoutResponse?: { rc?: string; msg?: string };
}

export async function login(
	creds: Credentials,
	transport: SessionTransport = {},
): Promise<SessionLogin> {
	const body = el("ses", "loginRequest", [
		["tid", creds.tid],
		["benid", creds.benid],
		["pin", creds.pin],
		["herstellerid", creds.herstellerid],
	]).replace("<ses:loginRequest>", `<ses:loginRequest xmlns:ses="${NAMESPACES.session}">`);

	const responseBody = await soapCall({
		endpoint: transport.endpoint ?? ENDPOINTS.session,
		soapAction: SOAP_ACTIONS.login,
		bodyXml: body,
		...(transport.fetch !== undefined && { fetch: transport.fetch }),
		...(transport.timeoutMs !== undefined && { timeoutMs: transport.timeoutMs }),
	});

	const parsed = parseXml<LoginResponseXml>(responseBody);
	const r = parsed.loginResponse;
	if (!r || r.id === undefined || r.rc === undefined) {
		throw new InvalidXmlError("login: missing id/rc in response", responseBody);
	}
	const rc = Number.parseInt(r.rc, 10);
	if (rc !== 0) throw rcToError(rc, r.msg);

	return { tid: creds.tid, benid: creds.benid, id: r.id };
}

export async function logout(
	session: SessionLogin,
	transport: SessionTransport = {},
): Promise<void> {
	const body = el("ses", "logoutRequest", [
		["tid", session.tid],
		["benid", session.benid],
		["id", session.id],
	]).replace("<ses:logoutRequest>", `<ses:logoutRequest xmlns:ses="${NAMESPACES.session}">`);

	const responseBody = await soapCall({
		endpoint: transport.endpoint ?? ENDPOINTS.session,
		soapAction: SOAP_ACTIONS.logout,
		bodyXml: body,
		...(transport.fetch !== undefined && { fetch: transport.fetch }),
		...(transport.timeoutMs !== undefined && { timeoutMs: transport.timeoutMs }),
	});

	const parsed = parseXml<LogoutResponseXml>(responseBody);
	const r = parsed.logoutResponse;
	if (!r || r.rc === undefined) {
		throw new InvalidXmlError("logout: missing rc in response", responseBody);
	}
	const rc = Number.parseInt(r.rc, 10);
	if (rc !== 0) throw rcToError(rc, r.msg);
}
