/**
 * TVW — Teamverwaltung (FinanzOnline team management).
 * Source: schemas/tvw/current/BMF_XSD_Schema_Teamverwaltung.xsd (Stand 18.10.2006).
 *
 * Used by Steuerberater / Wirtschaftsprüfer to provision teams in FinanzOnline:
 * a single TEAM block per upload carries a TEAMNAME action plus zero-or-more
 * BENUTZER (team-member) and KLIENT (client-mandate) actions.
 *
 * Root element is `TEAM_UEBERMITTLUNG` (not `ERKLAERUNGS_UEBERMITTLUNG`); the
 * info envelope counts `ANZAHL_TEAM` (1..9999) rather than `ANZAHL_ERKLAERUNGEN`.
 *
 * Note: the upstream 2006 XSD ships a malformed `alphanumerisch50` pattern
 * (BMF-quirk slash-escaped character class), so libxml2 cannot compile it.
 * Conformance is enforced by Zod at runtime; XSD-conformance tests are skipped
 * for this module — same situation as the BET module.
 */

export type Anbringen = "TVW";

/** Action for the entire TEAMNAME element: N=Neu (create), L=Lösch (delete), A=Ändern (rename). */
export type AktionTeam = "N" | "L" | "A";

/** Action for a single BENUTZER / KLIENT line: N=Neu (add), L=Lösch (remove). */
export type AktionItem = "N" | "L";

export interface InfoDaten {
	artIdentifikationsbegriff: "FASTNR";
	identifikationsbegriff: string;
	paketNr: number;
	datumErstellung: string;
	uhrzeitErstellung: string;
	/** ANZAHL_TEAM — declared count of TEAM blocks (1..9999). */
	anzahlTeam: number;
}

export interface Teamname {
	value: string;
	aktion: AktionTeam;
}

export interface Benutzer {
	/** BENID — FinanzOnline benutzer-ID, with aktion attribute. */
	benid: string;
	aktion: AktionItem;
}

export interface Klient {
	/** FASTNR — client's 9-digit FASTNR, with aktion attribute. */
	fastnr: string;
	aktion: AktionItem;
}

export interface Team {
	art: Anbringen;
	satznr: number;
	anbringen: Anbringen;
	teamname: Teamname;
	benutzer?: ReadonlyArray<Benutzer>;
	klient?: ReadonlyArray<Klient>;
}

export interface TvwBody {
	info: InfoDaten;
	team: Team;
}
