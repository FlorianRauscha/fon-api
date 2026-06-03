import { z } from "zod";

/** SOER's FASTNR is xsd:string with 9-digit pattern (no numeric range refinement). */
const fastnr9 = z.string().regex(/^[0-9]{9}$/, "Expected 9 digits");

/** RefNr — 1..23 chars, [0-9a-zA-Z-/\\]. */
const refNrSchema = z
	.string()
	.min(1)
	.max(23)
	.regex(/^[0-9a-zA-Z\-/\\]{1,23}$/, "Expected 1..23 chars [0-9a-zA-Z-/\\]");

/** MessageRefId — 1..36 chars, [0-9a-zA-Z-]. */
const messageRefIdSchema = z
	.string()
	.min(1)
	.max(36)
	.regex(/^[0-9a-zA-Z-]{1,36}$/, "Expected 1..36 chars [0-9a-zA-Z-]");

/** ZR — 4 or 6 digits (YYYY or YYYYMM). */
const zrSchema = z.string().regex(/^[0-9]{4,6}$/, "Expected 4..6 digits (YYYY or YYYYMM)");

/** xsd:dateTime — at minimum YYYY-MM-DDTHH:MM:SS optionally with fractional seconds and timezone. */
const dateTimeSchema = z
	.string()
	.regex(
		/^[0-9]{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])T(?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](?:\.[0-9]+)?(?:Z|[+-](?:[01][0-9]|2[0-3]):[0-5][0-9])?$/,
		"Expected ISO-8601 dateTime",
	);

const soerArtSchema = z.enum(["E108c", "KR1", "ENAV1", "KOH1", "WA1", "ELA1", "EGA1"]);

const infoDatenSchema = z
	.object({
		fastnrFonTn: fastnr9,
	})
	.strict();

const messageSpecSchema = z
	.object({
		messageRefId: messageRefIdSchema,
		timestamp: dateTimeSchema,
	})
	.strict();

const soerEntrySchema = z
	.object({
		art: soerArtSchema,
		refNr: refNrSchema,
		fastnrOrg: fastnr9,
		datvon: zrSchema,
		datbis: zrSchema.optional(),
		anhang: z.string().min(1),
	})
	.strict();

export const soerBody = z
	.object({
		info: infoDatenSchema.optional(),
		messageSpec: messageSpecSchema,
		soer: z.array(soerEntrySchema).min(1).max(10_000),
	})
	.strict();

export type SoerBodyParsed = z.infer<typeof soerBody>;
