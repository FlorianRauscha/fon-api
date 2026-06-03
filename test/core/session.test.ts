import { describe, expect, it, vi } from "vitest";
import { InvalidCredentialsError, SessionExpiredError } from "../../src/core/errors.js";
import { login, logout } from "../../src/core/session.js";

const okLogin = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <loginResponse xmlns="https://finanzonline.bmf.gv.at/fon/ws/session">
      <id>SESSION_TOKEN_123ABC</id>
      <rc>0</rc>
    </loginResponse>
  </soap:Body>
</soap:Envelope>`;

const expiredLogin = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <loginResponse xmlns="https://finanzonline.bmf.gv.at/fon/ws/session">
      <id></id>
      <rc>-1</rc>
      <msg>Die Session ID ist ungültig oder abgelaufen.</msg>
    </loginResponse>
  </soap:Body>
</soap:Envelope>`;

const invalidCreds = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <loginResponse xmlns="https://finanzonline.bmf.gv.at/fon/ws/session">
      <id></id>
      <rc>-4</rc>
      <msg>Nicht berechtigt</msg>
    </loginResponse>
  </soap:Body>
</soap:Envelope>`;

const okLogout = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <logoutResponse xmlns="https://finanzonline.bmf.gv.at/fon/ws/session">
      <rc>0</rc>
    </logoutResponse>
  </soap:Body>
</soap:Envelope>`;

const creds = {
	tid: "1000103u3032",
	benid: "webserv99",
	pin: "webserv99",
	herstellerid: "ATU12345678",
};

function mockFetch(body: string, status = 200): typeof fetch {
	return vi.fn(async () => new Response(body, { status })) as unknown as typeof fetch;
}

describe("login", () => {
	it("returns SessionLogin on rc=0", async () => {
		const fakeFetch = mockFetch(okLogin);
		const session = await login(creds, { fetch: fakeFetch });
		expect(session).toEqual({
			tid: "1000103u3032",
			benid: "webserv99",
			id: "SESSION_TOKEN_123ABC",
		});
	});

	it("includes all loginRequest elements with namespaced prefix in the request body", async () => {
		const captured: string[] = [];
		const fakeFetch = vi.fn(async (_url, init) => {
			captured.push(String((init as RequestInit).body));
			return new Response(okLogin, { status: 200 });
		}) as unknown as typeof fetch;
		await login(creds, { fetch: fakeFetch });
		const body = captured[0] ?? "";
		expect(body).toContain("<ses:tid>1000103u3032</ses:tid>");
		expect(body).toContain("<ses:benid>webserv99</ses:benid>");
		expect(body).toContain("<ses:pin>webserv99</ses:pin>");
		expect(body).toContain("<ses:herstellerid>ATU12345678</ses:herstellerid>");
		expect(body).toContain('xmlns:ses="https://finanzonline.bmf.gv.at/fon/ws/session"');
	});

	it("throws SessionExpiredError on rc=-1", async () => {
		await expect(login(creds, { fetch: mockFetch(expiredLogin) })).rejects.toBeInstanceOf(
			SessionExpiredError,
		);
	});

	it("throws InvalidCredentialsError on rc=-4", async () => {
		await expect(login(creds, { fetch: mockFetch(invalidCreds) })).rejects.toBeInstanceOf(
			InvalidCredentialsError,
		);
	});
});

describe("logout", () => {
	it("succeeds on rc=0", async () => {
		await expect(
			logout(
				{ tid: "1000103u3032", benid: "webserv99", id: "SID" },
				{ fetch: mockFetch(okLogout) },
			),
		).resolves.toBeUndefined();
	});
});
