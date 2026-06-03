import { describe, expect, it } from "vitest";
import {
	type ValidationIssue,
	formatGroupedIssues,
	groupIssuesByPath,
} from "../../src/core/issues.js";

describe("groupIssuesByPath", () => {
	it("collapses paths to a section + leaf field", () => {
		const issues: ValidationIssue[] = [
			{ path: "info.identifikationsbegriff", message: "Expected 9 digits" },
			{ path: "info.anzahlErklaerungen", message: "Out of range" },
			{
				path: "erklaerungen.0.allgemein.fastnr",
				message: "Expected 9 digits",
			},
			{
				path: "erklaerungen.0.bemessungsgrundlage.bemSta3",
				message: "Out of range",
			},
		];
		const grouped = groupIssuesByPath(issues);
		expect(grouped.total).toBe(4);
		const sections = grouped.sections.map((s) => s.section);
		expect(sections).toEqual([
			"info",
			"erklaerungen[0].allgemein",
			"erklaerungen[0].bemessungsgrundlage",
		]);
		expect(grouped.sections[0]?.issues).toEqual([
			{ path: "identifikationsbegriff", message: "Expected 9 digits" },
			{ path: "anzahlErklaerungen", message: "Out of range" },
		]);
	});

	it("preserves first-occurrence order across sections", () => {
		const issues: ValidationIssue[] = [
			{ path: "a.x", message: "1" },
			{ path: "b.y", message: "2" },
			{ path: "a.z", message: "3" },
		];
		const grouped = groupIssuesByPath(issues);
		expect(grouped.sections.map((s) => s.section)).toEqual(["a", "b"]);
		expect(grouped.sections[0]?.issues).toHaveLength(2);
	});

	it("uses (root) for top-level scalar paths", () => {
		const issues: ValidationIssue[] = [{ path: "anbringen", message: "Required" }];
		const grouped = groupIssuesByPath(issues);
		expect(grouped.sections[0]?.section).toBe("(root)");
	});
});

describe("formatGroupedIssues", () => {
	it("renders a scannable plain-text block", () => {
		const issues: ValidationIssue[] = [
			{ path: "info.paketNr", message: "Out of range" },
			{ path: "erklaerungen.0.allgemein.fastnr", message: "Expected 9 digits" },
		];
		const out = formatGroupedIssues(groupIssuesByPath(issues));
		expect(out).toContain("2 issues across 2 sections");
		expect(out).toContain("info: 1 issue");
		expect(out).toContain("paketNr — Out of range");
		expect(out).toContain("erklaerungen[0].allgemein: 1 issue");
		expect(out).toContain("fastnr — Expected 9 digits");
	});
});
