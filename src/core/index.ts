export { ENDPOINTS, NAMESPACES, SOAP_ACTIONS, TEST_CREDENTIALS } from "./endpoints.js";
export {
	FonError,
	InvalidCredentialsError,
	InvalidXmlError,
	MaintenanceError,
	NetworkError,
	NotAuthorizedError,
	ReturncodeError,
	SessionExpiredError,
	SoapFaultError,
	ValidationError,
} from "./errors.js";
export {
	formatGroupedIssues,
	type GroupedIssues,
	groupIssuesByPath,
	type ValidationIssue,
} from "./issues.js";
export { describeRc, RC_DESCRIPTIONS, rcToError } from "./returncodes.js";
export { buildEnvelope, extractBody, soapCall, type SoapCallOptions } from "./soap.js";
export {
	type Credentials,
	login,
	logout,
	type SessionLogin,
	type SessionTransport,
} from "./session.js";
export { createClient, FonClient, type FonClientOptions } from "./client.js";
export { el, escapeXml, parseXml } from "./xml.js";
