import { describe, expect, it } from "vitest";
import {
	InvalidCredentialsError,
	NotAuthorizedError,
	ReturncodeError,
	SessionExpiredError,
} from "../../src/core/errors.js";
import { describeRc, rcToError } from "../../src/core/returncodes.js";

describe("describeRc", () => {
	it("returns the BMF text for known returncodes", () => {
		expect(describeRc(0)).toBe("Aufruf ok");
		expect(describeRc(-1)).toContain("Session ID");
		expect(describeRc(-2)).toContain("Wartungsarbeiten");
	});

	it("returns a fallback for unknown returncodes", () => {
		expect(describeRc(-99)).toBe("Unknown returncode -99");
	});
});

describe("rcToError", () => {
	it("maps -1 to SessionExpiredError", () => {
		expect(rcToError(-1)).toBeInstanceOf(SessionExpiredError);
	});
	it("maps -4 to InvalidCredentialsError", () => {
		expect(rcToError(-4)).toBeInstanceOf(InvalidCredentialsError);
	});
	it("maps -7 to NotAuthorizedError", () => {
		expect(rcToError(-7)).toBeInstanceOf(NotAuthorizedError);
	});
	it("maps unknown rc to plain ReturncodeError", () => {
		const e = rcToError(-3);
		expect(e).toBeInstanceOf(ReturncodeError);
		expect(e.rc).toBe(-3);
	});

	it("uses provided msg over default description", () => {
		const e = rcToError(-3, "custom");
		expect(e.msg).toBe("custom");
	});
});
