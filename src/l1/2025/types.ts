/**
 * L1 — Arbeitnehmerveranlagung (employee tax assessment), tax year 2025.
 * Source: schemas/l1/2025/BMF_XSD_Schema_Arbeitnehmerveranlagung_2025.xsd
 *
 * COVERAGE: every section under `<ERKLAERUNG>` has a typed shape:
 *   - ALLGEMEINE_DATEN (13 fields)
 *   - SONDERAUSGABEN (KZ460, KZ280)
 *   - WERBUNGSKOSTEN (16 KZs + BERUF + 2 job blocks)
 *   - AUSSERGEWOEHNLICHE_BELASTUNGEN
 *       → ALLGEMEIN (7 fields)
 *       → BEHINDERUNG (Steuerpflichtiger + Partner blocks, ~10 fields each)
 *       → KIND_AUSBILDUNG_BEHINDERUNG (1..20 children × ~95 fields incl. FB-Monate map)
 *   - FREIBETRAGSBESCHEID (INDFB, KZ449)
 *   - INTERNATIONAL (51 fields)
 *   - BESONDERE_SONDERAUSGABEN_VERTEILUNG (15 fields)
 *
 * Every section AND every nested sub-section accepts `{ rawInner: string }` as
 * an escape hatch — `'rawInner' in section` is the runtime discriminator. Adding
 * new typed fields later is non-breaking: callers passing `{ rawInner }` keep
 * working. Builder dispatches recursively; XML output order matches the XSD
 * `<xs:sequence>` exactly. All generated payloads validate against the official
 * BMF L1 2025 XSD via libxml2 (see test/l1/2025/xsd-conformance.test.ts).
 */

export interface InfoDaten {
	artIdentifikationsbegriff: "FASTNR";
	identifikationsbegriff: string;
	paketNr: number;
	datumErstellung: string;
	uhrzeitErstellung: string;
	anzahlErklaerungen: number;
}

export interface AllgemeineDaten {
	/** Always "L1". */
	anbringen: "L1";
	/** Tax year (YYYY). */
	zr: string;
	/** 9-digit FASTNR. */
	fastnr: string;
	kundeninfo?: string;
	/**
	 * ANZBEZ — number of bezugsauszahlende Stellen (employers / pensions paying
	 * income). 0..99.
	 */
	anzbez: number;
	/** KZ725 — Werbungskosten-Pauschale (optional). */
	kz725?: number;
	/** AVAB — Alleinverdienerabsetzbetrag claim ("J"). */
	avab?: "J";
	/** AEAB — Alleinerzieherabsetzbetrag claim ("J"). */
	aeab?: "J";
	/** KINDFB — count of children for Kinderfreibetrag, 0..99. */
	kindfb?: number;
	/** KMB_30 — Kinderfreibetrag-Mehrbetrag § 33 Abs. 7 ("J"). */
	kmb30?: "J";
	/** KMB_PART — Kindermehrbetrag for partner ("J"). */
	kmbPart?: "J";
	/** ERH_PAB — erhöhter Pensionistenabsetzbetrag claim ("J"). */
	erhPab?: "J";
	/** MEHRKI — Mehrkindzuschlag claim ("J"). */
	mehrki?: "J";
}

/**
 * Each optional inner section accepts either a typed shape OR a raw XML
 * inner-content string ({ rawInner }) as an escape hatch. The builder dispatches
 * on the presence of `rawInner`. Sections without a typed alternative yet only
 * accept `{ rawInner }`.
 */
export interface RawInnerSection {
	/** Inner XML (without the wrapping element). */
	rawInner: string;
}

/** Typed SONDERAUSGABEN — Spenden (KZ460) and Kirchenbeitrag (KZ280). */
export interface TypedSonderausgaben {
	/** KZ460 — Zuwendungen / Spenden (donations to qualifying organisations). */
	kz460?: number;
	/** KZ280 — Kirchenbeitrag (mandatory church contributions). */
	kz280?: number;
}

export type SonderausgabenSection = RawInnerSection | TypedSonderausgaben;

/**
 * WKBERUF profession codes (A=Artist, B=Beamter, F=Forstwirt, J=Journalist,
 * M=Musiker, FO=Forstarbeiter, FM=Fertigungsmeister, HA=Hausarbeiter,
 * HE=Heimarbeiter, V=Vertreter, P=Politiker, E=Expatriate — see BMF Ausfüllhilfe).
 */
export const WK_BERUF_CODES = [
	"A",
	"B",
	"F",
	"J",
	"M",
	"FO",
	"FM",
	"HA",
	"HE",
	"V",
	"P",
	"E",
] as const;
export type WkBerufCode = (typeof WK_BERUF_CODES)[number];

/** A single Werbungskosten job block (used twice — Job 1 and Job 2). */
export interface WerbungskostenJob {
	beruf: WkBerufCode;
	/** Beginn Berufsausübung im Veranlagungszeitraum (gMonthDay, format `--MM-DD`). */
	zrvon: string;
	/** Ende Berufsausübung im Veranlagungszeitraum (gMonthDay, format `--MM-DD`). */
	zrbis: string;
	/** KZ437 (Job 1) or KZ438 (Job 2) — pauschale Werbungskosten of this job. */
	kzPauschale?: number;
}

/**
 * Typed WERBUNGSKOSTEN. Field order intentionally mirrors the XSD sequence so
 * the builder can emit them in schema-required order without re-sorting.
 */
export interface TypedWerbungskosten {
	kz718?: number;
	kz916?: number;
	kz717?: number;
	kz158?: number;
	kz274?: number;
	/** Free-text profession (max 30 chars). */
	beruf?: string;
	kz169?: number;
	kz719?: number;
	kz720?: number;
	kz721?: number;
	kz722?: number;
	kz300?: number;
	kz723?: number;
	kz159?: number;
	kz724?: number;
	job1?: WerbungskostenJob;
	job2?: WerbungskostenJob;
}

export type WerbungskostenSection = RawInnerSection | TypedWerbungskosten;

/** Typed AUSSERGEWOEHNLICHE_BELASTUNGEN → ALLGEMEIN. */
export interface TypedAbAllgemein {
	/** AGBEL_P — Auswärtige Berufsausbildung Partner ("J"). */
	agbelP?: "J";
	kz730?: number;
	kz731?: number;
	kz734?: number;
	kz735?: number;
	kz475?: number;
	/** OPFERAUS — Opfer-/Auslandsdiensthilfe ("J"). */
	opferaus?: "J";
}

export type AbAllgemeinSection = RawInnerSection | TypedAbAllgemein;

/**
 * Typed BEHINDERUNG_STEUERPFLICHTIGER — disability claim block for the taxpayer.
 * Mirror structure exists for the partner (`TypedAbBehindPartner`) but with
 * field names suffixed `_P` instead of `_S` and KZ codes 436/417/418 instead of
 * 435/476/439.
 */
export interface TypedAbBehindSelf {
	/** KOERPER_S — Grad der Behinderung in percent (0..100). */
	koerperS?: number;
	/** DIAET_S_Z — Diät: Zuckerkrankheit ("J"). */
	diaetSz?: "J";
	/** DIAET_S_G — Diät: Gallenleiden ("J"). */
	diaetSg?: "J";
	/** DIAET_S_M — Diät: Magenleiden ("J"). */
	diaetSm?: "J";
	/** PFLEGE_S_A — Anfang der Pflegegeldzahlung (gMonth, `--MM`). */
	pflegeSa?: string;
	/** PFLEGE_S_E — Ende der Pflegegeldzahlung (gMonth, `--MM`). */
	pflegeSe?: string;
	/** KFZ_S — Kfz-Pauschale ("J"). */
	kfzS?: "J";
	kz435?: number;
	kz476?: number;
	kz439?: number;
}

export interface TypedAbBehindPartner {
	/** KOERPER_P — Grad der Behinderung Partner (0..100). */
	koerperP?: number;
	diaetPz?: "J";
	diaetPg?: "J";
	diaetPm?: "J";
	pflegePa?: string;
	pflegePe?: string;
	kfzP?: "J";
	kz436?: number;
	kz417?: number;
	kz418?: number;
}

/** Typed AUSSERGEWOEHNLICHE_BELASTUNGEN → BEHINDERUNG (taxpayer + partner blocks). */
export interface TypedAbBehinderung {
	steuerpflichtiger?: RawInnerSection | TypedAbBehindSelf;
	partner?: RawInnerSection | TypedAbBehindPartner;
}

export type AbBehinderungSection = RawInnerSection | TypedAbBehinderung;

/**
 * One Familienbeihilfe-monthly entry: which roles (Steuerpflichtiger/Partner/
 * Unterhaltsleistender) get FB at 50% / 100% in this calendar month.
 */
export interface FbMonth {
	/** FB{n}_S — Steuerpflichtiger ("J"). */
	s?: "J";
	/** FB{n}_P — Partner ("J"). */
	p?: "J";
	/** FB{n}_U — Unterhaltsleistender ("J"). */
	u?: "J";
	/** FB{n}_50 — 50% Familienbeihilfe ("J"). */
	fb50?: "J";
	/** FB{n}_100 — 100% Familienbeihilfe ("J"). */
	fb100?: "J";
}

/** 12-month grid of Familienbeihilfe entries for a single child. */
export type FbMonate = Partial<Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12, FbMonth>>;

/**
 * Typed KIND_ANGABEN — per-child block. Field order matches the XSD `<xs:sequence>`
 * exactly. The 12-month FB grid (`fbMonate`) replaces 60 individual XSD elements
 * (FB1_S/P/U/50/100 .. FB12_S/P/U/50/100) with a structured map for ergonomics —
 * the builder expands it to the required FBn_X element names.
 */
export interface TypedKindAngaben {
	famname?: string;
	vorname?: string;
	/** VNRKIN_K — Versicherungsnummer Kind (10 digits). */
	vnrkinK?: string;
	/** GEBKIN_K — Geburtsdatum Kind (YYYY-MM-DD). */
	gebkinK?: string;
	/** EUROKV — EUROKV-Nummer Kind (max 20 chars). */
	eurokv?: string;
	/** WS_KIND — Wohnsitz Kind (BMF country code; may be "A"). */
	wsKind?: string;
	/** FBSN_50 — Familienbeihilfe Steuerpflichtiger neu 50% ("J"). */
	fbsn50?: "J";
	fbsn100?: "J";
	fbpn50?: "J";
	fbpn100?: "J";
	fbsu50?: "J";
	fbsu100?: "J";
	uab50?: "J";
	uab100?: "J";
	/** UNT_GES — Unterhalt gesamt. */
	untGes?: number;
	/** UNT_MTL — Unterhalt monatlich. */
	untMtl?: number;
	/** UNTAUSL — Unterhalt Auslandskind. */
	untausl?: number;
	/** AUSL_K_A — Auslands-Kind Anfang (gMonth `--MM`). */
	auslKa?: string;
	/** AUSL_K_E — Auslands-Kind Ende (gMonth `--MM`). */
	auslKe?: string;
	/** AGBEL_K — Auswärtige Berufsausbildung Kind. */
	agbelK?: number;
	/** KOSTRA_K — Kostentragungsanteil Kind in % (1..100). */
	kostraK?: number;
	/** MMBERU_K — Anzahl Monate Berufsausbildung 0..99. */
	mmberuK?: number;
	/** PLZ_K — Postleitzahl Kind. */
	plzK?: string;
	/** STAAT_K — Staat Kind (BMF country code; may be "A"). */
	staatK?: string;
	/** KOERPER_K — Grad der Behinderung Kind in % (0..100). */
	koerperK?: number;
	diaetKz?: "J";
	diaetKg?: "J";
	diaetKm?: "J";
	/** FBERH_K_A — Erhöhter FB Anfang (gMonth `--MM`). */
	fberhKa?: string;
	/** FBERH_K_E — Erhöhter FB Ende (gMonth `--MM`). */
	fberhKe?: string;
	/** PFLEGE_K — Pflegegeld Kind. */
	pflegeK?: number;
	pflegeKa?: string;
	pflegeKe?: string;
	kz28k?: number;
	kz71k?: number;
	kz29k?: number;
	/** NVSTAGZ — Nachversteuerung Tagesgelder. */
	nvstagz?: number;
	/** Familienbeihilfe-Monatsgrid (12 months × 5 flags). */
	fbMonate?: FbMonate;
}

/** Typed AUSSERGEWOEHNLICHE_BELASTUNGEN → KIND_AUSBILDUNG_BEHINDERUNG (1..20 KIND_ANGABEN). */
export interface TypedKindAusbildungBehinderung {
	kindAngaben: ReadonlyArray<RawInnerSection | TypedKindAngaben>;
}

export type KindAusbildungBehinderungSection = RawInnerSection | TypedKindAusbildungBehinderung;

/** Typed AUSSERGEWOEHNLICHE_BELASTUNGEN. */
export interface TypedAussergewoehnlicheBelastungen {
	allgemein?: AbAllgemeinSection;
	behinderung?: AbBehinderungSection;
	kindAusbildungBehinderung?: KindAusbildungBehinderungSection;
}

export type AussergewoehnlicheBelastungenSection =
	| RawInnerSection
	| TypedAussergewoehnlicheBelastungen;

/** Typed FREIBETRAGSBESCHEID — request for the advance assessment notice. */
export interface TypedFreibetragsbescheid {
	/** INDFB — Antrag auf Freibetragsbescheid ("J"). */
	indfb?: "J";
	/** KZ449 — voraussichtliche Werbungskosten / sonstige Aufwendungen. */
	kz449?: number;
}

export type FreibetragsbescheidSection = RawInnerSection | TypedFreibetragsbescheid;

/**
 * Typed BESONDERE_SONDERAUSGABEN_VERTEILUNG — apportionment of special-expenses
 * with the registered partner (Sonderausgaben-Aufteilung).
 *
 * Field order matches the XSD `<xs:sequence>` exactly so the builder can emit
 * them in schema-required order.
 */
export interface TypedBesondereSonderausgabenVerteilung {
	/** FAM_D — Familienname Partner (max 25 chars). */
	famD?: string;
	/** VOR_D — Vorname Partner (max 25 chars). */
	vorD?: string;
	/** VNR_D — Versicherungsnummer Partner (10 digits). */
	vnrD?: string;
	/** GEBDAT_D — Geburtsdatum Partner (YYYY-MM-DD). */
	gebdatD?: string;
	kz281?: number;
	kz282?: number;
	kz458?: number;
	/** ZUS1_D — Zustimmung Partner zur Aufteilung 1 ("J"). */
	zus1D?: "J";
	kz284?: number;
	/** ZEHN2_D — Zehnjahres-Verteilung 2 ("J"). */
	zehn2D?: "J";
	/** ZUS2_D — Zustimmung Partner zur Aufteilung 2 ("J"). */
	zus2D?: "J";
	/** ZEHN1_D — Zehnjahres-Verteilung 1 ("J"). */
	zehn1D?: "J";
	kz283?: number;
	kz117?: number;
	kz118?: number;
}

export type BesondereSonderausgabenVerteilungSection =
	| RawInnerSection
	| TypedBesondereSonderausgabenVerteilung;

/**
 * Typed INTERNATIONAL — cross-border tax fields (Auslandseinkünfte, Doppelbesteuerung,
 * Grenzgänger, ausländische Steuer/Lohnsteuer, Auslandsantrag). 51 fields total.
 * Field order matches the XSD `<xs:sequence>` exactly.
 *
 * Country codes (`staat3`, `as_staat`, `staatAn`, `land1L1`, `land2L1`) accept BMF's
 * laender enum (~250 entries). XSD validation in tests catches invalid codes.
 */
export interface TypedInternational {
	/** WS_INL — ohne weiteren inländischen Wohnsitz ("J"). */
	wsInl?: "J";
	/** GREG1614 — Grenzgänger gemäß § 16 EStG ("J"). */
	greg1614?: "J";
	/** WS_AUSAG — weiterer Wohnsitz im Ausland ("J"). */
	wsAusag?: "J";
	/** AUSLBEH — Auslandsbehinderung ("J"). */
	auslbeh?: "J";
	/** AUSLBEZ — Auslandsbezüge ("J"). */
	auslbez?: "J";
	/** INL_BON — inländischer Bonus ("J"). */
	inlBon?: "J";
	/** DBANRECH — Doppelbesteuerungs-Anrechnung ("J"). */
	dbanrech?: "J";
	/** AUSL_NSA — ausländischer Nicht-Selbständig-Arbeit ("J"). */
	auslNsa?: "J";
	/** WS_AUSL — Wohnsitz im Ausland ("J"). */
	wsAusl?: "J";
	/** AGLST — Auslandslohnsteuer ("J"). */
	aglst?: "J";
	/** INLBEZ — inländische Bezüge ("J"). */
	inlbez?: "J";
	/** AUSAG — Auslandsausgaben ("J"). */
	ausag?: "J";
	/** AUSL_BON — ausländischer Bonus ("J"). */
	auslBon?: "J";
	/** STAAT_3 — Drittland-Staatsangehörigkeit (BMF country code, may be "A"). */
	staat3?: string;
	/** ANS_BSG — Ansässigkeitsbescheinigung ("J"). */
	ansBsg?: "J";
	/** AUSL_EIN — ausländische Einkünfte ("J"). */
	auslEin?: "J";
	kz359?: number;
	/** PENSAUSL — Auslandspension ("J"). */
	pensausl?: "J";
	kz183?: number;
	kz377?: number;
	/** ANZL17 — Anzahl der L17-Lohnzettel (0..99). */
	anzl17?: number;
	kz187?: number;
	kz154?: number;
	kz544?: number;
	/** LAND1_L1 — Staat des 1. Auslands-L17 (BMF country code). */
	land1L1?: string;
	/** WK1_L1 — Werbungskosten 1. Auslands-L17. */
	wk1L1?: number;
	/** AUSLST1 — Auslandssteuer 1. Auslands-L17. */
	auslst1?: number;
	/** LAND2_L1 — Staat des 2. Auslands-L17. */
	land2L1?: string;
	wk2L1?: number;
	auslst2?: number;
	/** AUSNEIN — kein Auslandsantrag ("J"). */
	ausnein?: "J";
	/** AUSERH — erhöhter Auslandsantrag ("J"). */
	auserh?: "J";
	/** AUSANTR — Auslandsantrag ("J"). */
	ausantr?: "J";
	kz775?: number;
	kz453?: number;
	kz184?: number;
	/** SV_184 — Sozialversicherung zu KZ184 ("J" oder "N"). */
	sv184?: "J" | "N";
	kz493?: number;
	kz791?: number;
	/** ANTR9911 — Antrag § 99 Abs. 1 Z 1 ("J"). */
	antr9911?: "J";
	/** BESCHPFL — Beschränkt steuerpflichtig ("J"). */
	beschpfl?: "J";
	/** KEINWS — kein Wohnsitz ("J"). */
	keinws?: "J";
	/** AS_STAAT — Ansässigkeitsstaat (BMF country code, no Austria). */
	asStaat?: string;
	/** STAAT_AN — Anrechnungsstaat (BMF country code, may be "A"). */
	staatAn?: string;
	/** ANTR14 — Antrag § 14 ("J"). */
	antr14?: "J";
	/** EINK_S — ausländische Einkünfte Steuerpflichtiger. */
	einkS?: number;
	/** EINK_AND — andere ausländische Einkünfte. */
	einkAnd?: number;
	/** EINK_P — ausländische Einkünfte Partner. */
	einkP?: number;
	kz188?: number;
	/** STS_275 — § 275 Steuersatz ("J"). */
	sts275?: "J";
}

export type InternationalSection = RawInnerSection | TypedInternational;

export interface Erklaerung {
	/** Required `art="..."` attribute on the `<ERKLAERUNG>` element. Typically "L1". */
	art: string;
	/** Per-Erklärung sequence number. */
	satznr: number;
	allgemein: AllgemeineDaten;
	sonderausgaben?: SonderausgabenSection;
	werbungskosten?: WerbungskostenSection;
	aussergewoehnlicheBelastungen?: AussergewoehnlicheBelastungenSection;
	freibetragsbescheid?: FreibetragsbescheidSection;
	international?: InternationalSection;
	besondereSonderausgabenVerteilung?: BesondereSonderausgabenVerteilungSection;
}

export interface L1Body {
	info: InfoDaten;
	erklaerungen: ReadonlyArray<Erklaerung>;
}
