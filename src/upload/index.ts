import { ENDPOINTS, NAMESPACES, SOAP_ACTIONS } from "../core/endpoints.js";
import { InvalidXmlError } from "../core/errors.js";
import type { SessionTransport } from "../core/session.js";
import { soapCall } from "../core/soap.js";
import { el, parseXml } from "../core/xml.js";
import { tryParseProtocol } from "./protocol.js";
import type { UploadRequest, UploadResult } from "./types.js";

export type { Uebermittlung, UploadArt, UploadRequest, UploadResult } from "./types.js";
export { UPLOAD_ARTEN } from "./types.js";
export {
	parseProtocol,
	type ProtocolError,
	type ProtocolKind,
	type ProtocolMeta,
	type ProtocolResult,
	tryParseProtocol,
} from "./protocol.js";
export {
	type BuildBodyArgs,
	buildBody,
	listBuilders,
	UnknownVersionError,
	UnsupportedArtError,
	VersionRequiredError,
} from "./build-dispatcher.js";
export {
	type ArtDescription,
	describeArt,
	listSchemas,
	resolveSchema,
	UnknownSchemaError,
} from "./schema-registry.js";
export {
	type PipelineArgs,
	type PipelineBuildStage,
	type PipelineResult,
	type PipelineSubmitStage,
	type PipelineValidateStage,
	runPipeline,
} from "./pipeline.js";

interface UploadResponseXml {
	fileuploadResponse?: { rc?: string; msg?: string };
}

export async function upload(
	req: UploadRequest,
	transport: SessionTransport = {},
): Promise<UploadResult> {
	const body = el("fu", "fileuploadRequest", [
		["tid", req.tid],
		["benid", req.benid],
		["id", req.id],
		["art", req.art],
		["uebermittlung", req.uebermittlung],
		["data", req.data],
	]).replace(
		"<fu:fileuploadRequest>",
		`<fu:fileuploadRequest xmlns:fu="${NAMESPACES.fileupload}">`,
	);

	const responseBody = await soapCall({
		endpoint: transport.endpoint ?? ENDPOINTS.fileupload,
		soapAction: SOAP_ACTIONS.upload,
		bodyXml: body,
		...(transport.fetch !== undefined && { fetch: transport.fetch }),
		...(transport.timeoutMs !== undefined && { timeoutMs: transport.timeoutMs }),
	});

	const parsed = parseXml<UploadResponseXml>(responseBody);
	const r = parsed.fileuploadResponse;
	if (!r || r.rc === undefined || r.msg === undefined) {
		throw new InvalidXmlError("upload: missing rc/msg in response", responseBody);
	}
	const result: UploadResult = { rc: Number.parseInt(r.rc, 10), msg: r.msg };
	const protocol = tryParseProtocol(r.msg);
	if (protocol !== null) result.parsed = protocol;
	return result;
}
