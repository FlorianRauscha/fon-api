import { describe, expect, it, vi } from "vitest";
import { MaintenanceError, SoapFaultError } from "../../src/core/errors.js";
import { buildEnvelope, extractBody, soapCall } from "../../src/core/soap.js";

describe("buildEnvelope", () => {
	it("wraps body in SOAP envelope with namespace", () => {
		const env = buildEnvelope("<inner/>");
		expect(env).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(env).toContain('xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"');
		expect(env).toContain("<soap:Body><inner/></soap:Body>");
	});
});

describe("extractBody", () => {
	it("extracts inner body from a soap envelope", () => {
		const xml = `<?xml version="1.0"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><a><b>1</b></a></soap:Body></soap:Envelope>`;
		expect(extractBody(xml)).toBe("<a><b>1</b></a>");
	});

	it("works with default-namespaced envelope and ns-prefixed body element", () => {
		const xml = `<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/"><Body><ns0:foo xmlns:ns0="urn:x"/></Body></Envelope>`;
		expect(extractBody(xml)).toBe('<ns0:foo xmlns:ns0="urn:x"/>');
	});
});

describe("soapCall", () => {
	it("posts envelope with correct headers and returns extracted body", async () => {
		const fakeFetch = vi.fn(async (_url, init) => {
			expect((init as RequestInit).method).toBe("POST");
			const headers = (init as RequestInit).headers as Record<string, string>;
			expect(headers["Content-Type"]).toBe("text/xml; charset=utf-8");
			expect(headers.SOAPAction).toBe('"login"');
			return new Response(
				`<?xml version="1.0"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><ok/></soap:Body></soap:Envelope>`,
				{ status: 200, headers: { "Content-Type": "text/xml" } },
			);
		});

		const body = await soapCall({
			endpoint: "https://example.test/soap",
			soapAction: "login",
			bodyXml: "<req/>",
			fetch: fakeFetch as unknown as typeof fetch,
		});
		expect(body).toBe("<ok/>");
		expect(fakeFetch).toHaveBeenCalledOnce();
	});

	it("detects maintenance mode via /wartung/ marker", async () => {
		const fakeFetch = vi.fn(
			async () => new Response("<html><body>siehe /wartung/...</body></html>", { status: 200 }),
		);
		await expect(
			soapCall({
				endpoint: "https://example.test/soap",
				soapAction: "x",
				bodyXml: "<r/>",
				fetch: fakeFetch as unknown as typeof fetch,
			}),
		).rejects.toBeInstanceOf(MaintenanceError);
	});

	it("throws SoapFaultError on SOAP fault", async () => {
		const fault = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><soap:Fault><faultcode>x</faultcode></soap:Fault></soap:Body></soap:Envelope>`;
		const fakeFetch = vi.fn(async () => new Response(fault, { status: 500 }));
		await expect(
			soapCall({
				endpoint: "https://example.test/soap",
				soapAction: "x",
				bodyXml: "<r/>",
				fetch: fakeFetch as unknown as typeof fetch,
			}),
		).rejects.toBeInstanceOf(SoapFaultError);
	});
});
