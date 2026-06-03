import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../src/core/errors.js";
import { type TvwBody, build } from "../../../src/tvw/current/index.js";

const minimal: TvwBody = {
	info: {
		artIdentifikationsbegriff: "FASTNR",
		identifikationsbegriff: "234567890",
		paketNr: 1,
		datumErstellung: "2026-04-15",
		uhrzeitErstellung: "10:00:00",
		anzahlTeam: 1,
	},
	team: {
		art: "TVW",
		satznr: 1,
		anbringen: "TVW",
		teamname: { value: "Steuerteam Wien", aktion: "N" },
	},
};

describe("TVW build()", () => {
	it("emits well-formed TEAM_UEBERMITTLUNG with TEAMNAME aktion", () => {
		const xml = build(minimal);
		expect(xml).toContain("<?xml");
		expect(xml).toContain("<TEAM_UEBERMITTLUNG>");
		expect(xml).toContain("<ANZAHL_TEAM>1</ANZAHL_TEAM>");
		expect(xml).toContain('<TEAM art="TVW">');
		expect(xml).toContain("<ANBRINGEN>TVW</ANBRINGEN>");
		expect(xml).toContain('<TEAMNAME aktion="N">Steuerteam Wien</TEAMNAME>');
		expect(xml).toContain("</TEAM_UEBERMITTLUNG>");
	});

	it("supports A (rename) and L (delete) team-aktionen", () => {
		const rename = build({
			...minimal,
			team: { ...minimal.team, teamname: { value: "Renamed", aktion: "A" } },
		});
		expect(rename).toContain('<TEAMNAME aktion="A">Renamed</TEAMNAME>');
		const remove = build({
			...minimal,
			team: { ...minimal.team, teamname: { value: "Old Team", aktion: "L" } },
		});
		expect(remove).toContain('<TEAMNAME aktion="L">Old Team</TEAMNAME>');
	});

	it("emits BENUTZER + KLIENT lines with their per-line aktion attribute", () => {
		const xml = build({
			...minimal,
			team: {
				...minimal.team,
				benutzer: [
					{ benid: "WEBSERV99", aktion: "N" },
					{ benid: "OLDUSER", aktion: "L" },
				],
				klient: [
					{ fastnr: "123456789", aktion: "N" },
					{ fastnr: "987654320", aktion: "L" },
				],
			},
		});
		expect(xml).toContain('<BENUTZER><BENID aktion="N">WEBSERV99</BENID></BENUTZER>');
		expect(xml).toContain('<BENUTZER><BENID aktion="L">OLDUSER</BENID></BENUTZER>');
		expect(xml).toContain('<KLIENT><FASTNR aktion="N">123456789</FASTNR></KLIENT>');
		expect(xml).toContain('<KLIENT><FASTNR aktion="L">987654320</FASTNR></KLIENT>');
	});

	it("emits TEAM children in XSD-required order", () => {
		const xml = build({
			...minimal,
			team: {
				...minimal.team,
				benutzer: [{ benid: "BEN", aktion: "N" }],
				klient: [{ fastnr: "234567890", aktion: "N" }],
			},
		});
		const order = ["<SATZNR>", "<ANBRINGEN>", "<TEAMNAME", "<BENUTZER>", "<KLIENT>"];
		let last = -1;
		for (const t of order) {
			const idx = xml.indexOf(t);
			expect(idx).toBeGreaterThan(last);
			last = idx;
		}
	});

	it("rejects empty TEAMNAME", () => {
		const bad: TvwBody = {
			...minimal,
			team: { ...minimal.team, teamname: { value: "", aktion: "N" } },
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects invalid AktionTeam value (only N/L/A)", () => {
		const bad: TvwBody = {
			...minimal,
			team: {
				...minimal.team,
				// biome-ignore lint/suspicious/noExplicitAny: testing runtime rejection of unknown aktion
				teamname: { value: "X", aktion: "X" as any },
			},
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects out-of-range FASTNR on a Klient line", () => {
		const bad: TvwBody = {
			...minimal,
			team: {
				...minimal.team,
				klient: [{ fastnr: "000000001", aktion: "N" }],
			},
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});

	it("rejects ANZAHL_TEAM out of bounds", () => {
		const bad: TvwBody = {
			...minimal,
			info: { ...minimal.info, anzahlTeam: 10_000 },
		};
		expect(() => build(bad)).toThrow(ValidationError);
	});
});
