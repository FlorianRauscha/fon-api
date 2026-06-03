/**
 * Shape and group `ValidationError.issues` for human/agent consumption.
 *
 * Zod produces a flat array of `{ path, message }` records — one per failed
 * leaf. For top-level forms with dozens of fields across nested sections, that
 * list is hard to scan. `groupIssuesByPath` collapses paths to a stable
 * "section" key so callers can render
 *
 *   info: 2 issues
 *     identifikationsbegriff — Expected 9 digits
 *     anzahlErklaerungen — info.anzahlErklaerungen must equal erklaerungen.length
 *   erklaerungen[0].allgemein: 1 issue
 *     fastnr — Expected 9 digits
 *
 * The grouping is stable: the section key is the longest prefix that does not
 * yet name a leaf field, with `erklaerungen[N]` and inner sections preserved.
 */

export interface ValidationIssue {
	path: string;
	message: string;
}

export interface GroupedIssues {
	/** Sections in input order; each contains the field-level issues for that path prefix. */
	sections: ReadonlyArray<{ section: string; issues: ReadonlyArray<ValidationIssue> }>;
	/** Total leaf-issue count for headlining ("12 issues across 3 sections"). */
	total: number;
}

const ARRAY_INDEX = /\.(\d+)(?=\.|$)/g;

/**
 * Convert a Zod path like `"erklaerungen.0.bemessungsgrundlage.bemSta3"` to a
 * stable section key + relative leaf field. Leaves with no nested section
 * (e.g. `"info.paketNr"`) keep "info" as their section.
 */
function splitSection(path: string): { section: string; field: string } {
	const normalized = path.replace(ARRAY_INDEX, "[$1]");
	const segments = normalized.split(".");
	if (segments.length <= 1) return { section: "(root)", field: normalized || "(root)" };
	const last = segments[segments.length - 1] as string;
	const section = segments.slice(0, -1).join(".");
	return { section, field: last };
}

/**
 * Group a flat list of issues by their section prefix. Section order matches
 * first-occurrence order in the input array.
 */
export function groupIssuesByPath(issues: ReadonlyArray<ValidationIssue>): GroupedIssues {
	const order: string[] = [];
	const map = new Map<string, ValidationIssue[]>();
	for (const issue of issues) {
		const { section, field } = splitSection(issue.path);
		if (!map.has(section)) {
			map.set(section, []);
			order.push(section);
		}
		const fieldOnlyMessage =
			issue.path === field || issue.path.endsWith(`.${field}`)
				? { path: field, message: issue.message }
				: issue;
		map.get(section)?.push(fieldOnlyMessage);
	}
	return {
		sections: order.map((section) => ({
			section,
			issues: map.get(section) ?? [],
		})),
		total: issues.length,
	};
}

/** Render grouped issues as human-readable plain text (one section per block). */
export function formatGroupedIssues(grouped: GroupedIssues): string {
	const lines: string[] = [
		`${grouped.total} issue${grouped.total === 1 ? "" : "s"} across ${grouped.sections.length} section${grouped.sections.length === 1 ? "" : "s"}:`,
	];
	for (const { section, issues } of grouped.sections) {
		lines.push(`  ${section}: ${issues.length} issue${issues.length === 1 ? "" : "s"}`);
		for (const issue of issues) {
			lines.push(`    ${issue.path} — ${issue.message}`);
		}
	}
	return lines.join("\n");
}
