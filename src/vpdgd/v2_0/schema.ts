import { z } from "zod";

const fastnr9 = z.string().regex(/^[0-9]{9}$/, "Expected 9 digits");

const versSchema = z.string().regex(/^[0-9]{2}\.[0-9]{2}$/, "Expected NN.NN");

const infoDatenSchema = z
	.object({
		fastnrFonTn: fastnr9,
		fastnrOrg: fastnr9,
		vers: versSchema,
	})
	.strict();

/**
 * Caller's pre-validated `<CBC_OECD>` payload — must contain a `<CBC_OECD`
 * opening tag and matching closing tag. Deeper structure is the caller's
 * responsibility.
 */
const cbcOecdInnerSchema = z
	.string()
	.min(1)
	.refine(
		(s) => /<CBC_OECD[\s>]/.test(s) && /<\/CBC_OECD>\s*$/.test(s.trim()),
		"Expected a serialized <CBC_OECD>...</CBC_OECD> element",
	);

export const vpdgdBody = z
	.object({
		info: infoDatenSchema,
		cbcOecdInner: cbcOecdInnerSchema,
	})
	.strict();

export type VpdgdBodyParsed = z.infer<typeof vpdgdBody>;
