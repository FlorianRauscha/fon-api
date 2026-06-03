import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: "@_",
	removeNSPrefix: true,
	parseTagValue: false,
	parseAttributeValue: false,
	trimValues: true,
});

export function parseXml<T = unknown>(xml: string): T {
	return parser.parse(xml) as T;
}

const XML_ENTITIES: Readonly<Record<string, string>> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&apos;",
};

export function escapeXml(value: string): string {
	return value.replace(/[&<>"']/g, (c) => XML_ENTITIES[c] ?? c);
}

/**
 * Build a single qualified element. Children are concatenated as raw XML strings.
 * The order of children is preserved — important for XSDs with `<xsd:sequence>`.
 */
export function el(
	prefix: string,
	name: string,
	children: ReadonlyArray<readonly [string, string | number | undefined]>,
): string {
	const inner = children
		.filter(([, v]) => v !== undefined)
		.map(([n, v]) => `<${prefix}:${n}>${escapeXml(String(v))}</${prefix}:${n}>`)
		.join("");
	return `<${prefix}:${name}>${inner}</${prefix}:${name}>`;
}
