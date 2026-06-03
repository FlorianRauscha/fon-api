import { z } from "zod";

const fastnr = z
	.string()
	.regex(/^[0-9]{9}$/, "Expected 9 digits")
	.refine((s) => {
		const n = Number(s);
		return n >= 20_000_010 && n <= 989_999_999;
	}, "Out of valid FASTNR range");

const datum = z
	.string()
	.regex(/^[0-9]{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])$/, "Expected YYYY-MM-DD");
const uhrzeit = z
	.string()
	.regex(/^(?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, "Expected HH:MM:SS");

/** alphanumerisch50 — 1..50 chars (the upstream BMF pattern is malformed; we keep length-only). */
const an50 = z.string().min(1).max(50);

/** BENID — FinanzOnline benutzer-ID; XSD declares xs:string, so we trust caller-provided length. */
const benid = z.string().min(1);

const aktionTeamSchema = z.enum(["N", "L", "A"]);
const aktionItemSchema = z.enum(["N", "L"]);

const infoDatenSchema = z.object({
	artIdentifikationsbegriff: z.literal("FASTNR"),
	identifikationsbegriff: fastnr,
	paketNr: z.number().int().min(1).max(999_999_999),
	datumErstellung: datum,
	uhrzeitErstellung: uhrzeit,
	anzahlTeam: z.number().int().min(1).max(9_999),
});

const teamnameSchema = z
	.object({
		value: an50,
		aktion: aktionTeamSchema,
	})
	.strict();

const benutzerSchema = z
	.object({
		benid,
		aktion: aktionItemSchema,
	})
	.strict();

const klientSchema = z
	.object({
		fastnr,
		aktion: aktionItemSchema,
	})
	.strict();

const teamSchema = z
	.object({
		art: z.literal("TVW"),
		satznr: z.number().int().min(1).max(999_999_999),
		anbringen: z.literal("TVW"),
		teamname: teamnameSchema,
		benutzer: z.array(benutzerSchema).optional(),
		klient: z.array(klientSchema).optional(),
	})
	.strict();

export const tvwBody = z
	.object({
		info: infoDatenSchema,
		team: teamSchema,
	})
	.strict();

export type TvwBodyParsed = z.infer<typeof tvwBody>;
