import { describe, expect, it } from "vitest";
import { ABFRAGE_ARTEN } from "../../src/abfrage/types.js";

describe("ABFRAGE_ARTEN", () => {
	it("matches the 7 art_EnumType values from the abfrage XSD (in XSD order)", () => {
		expect([...ABFRAGE_ARTEN]).toEqual([
			"LOHNZETTEL",
			"SONDERAUSGABEN",
			"LEITUNGSRECHTE",
			"OEKOSONDERAUSGABENPAUSCHALE",
			"HOCHWASSER",
			"AUSSERORDENTLICHEGUTSCHRIFT",
			"PAUSCHALEREISEAUFWANDSENTSCHAEDIGUNGEN",
		]);
	});
});
