import { ValidationError } from "../../core/errors.js";
import { escapeXml } from "../../core/xml.js";
import { kzEl } from "../_kz.js";
import { l1Body } from "./schema.js";
import type {
	AbAllgemeinSection,
	AbBehinderungSection,
	AllgemeineDaten,
	AussergewoehnlicheBelastungenSection,
	BesondereSonderausgabenVerteilungSection,
	Erklaerung,
	FreibetragsbescheidSection,
	InfoDaten,
	InternationalSection,
	KindAusbildungBehinderungSection,
	L1Body,
	RawInnerSection,
	SonderausgabenSection,
	TypedAbAllgemein,
	TypedAbBehindPartner,
	TypedAbBehindSelf,
	TypedAbBehinderung,
	TypedAussergewoehnlicheBelastungen,
	TypedBesondereSonderausgabenVerteilung,
	TypedFreibetragsbescheid,
	TypedInternational,
	TypedKindAngaben,
	TypedKindAusbildungBehinderung,
	TypedSonderausgaben,
	TypedWerbungskosten,
	WerbungskostenJob,
	WerbungskostenSection,
} from "./types.js";

function infoXml(i: InfoDaten): string {
	return [
		"<INFO_DATEN>",
		`<ART_IDENTIFIKATIONSBEGRIFF>${escapeXml(i.artIdentifikationsbegriff)}</ART_IDENTIFIKATIONSBEGRIFF>`,
		`<IDENTIFIKATIONSBEGRIFF>${escapeXml(i.identifikationsbegriff)}</IDENTIFIKATIONSBEGRIFF>`,
		`<PAKET_NR>${i.paketNr}</PAKET_NR>`,
		`<DATUM_ERSTELLUNG type="datum">${escapeXml(i.datumErstellung)}</DATUM_ERSTELLUNG>`,
		`<UHRZEIT_ERSTELLUNG type="uhrzeit">${escapeXml(i.uhrzeitErstellung)}</UHRZEIT_ERSTELLUNG>`,
		`<ANZAHL_ERKLAERUNGEN>${i.anzahlErklaerungen}</ANZAHL_ERKLAERUNGEN>`,
		"</INFO_DATEN>",
	].join("");
}

function allgemeinXml(a: AllgemeineDaten): string {
	const parts = [
		`<ANBRINGEN>${escapeXml(a.anbringen)}</ANBRINGEN>`,
		`<ZR>${escapeXml(a.zr)}</ZR>`,
		`<FASTNR>${escapeXml(a.fastnr)}</FASTNR>`,
		a.kundeninfo !== undefined ? `<KUNDENINFO>${escapeXml(a.kundeninfo)}</KUNDENINFO>` : "",
		`<ANZBEZ>${a.anzbez}</ANZBEZ>`,
		kzEl("KZ725", a.kz725),
		a.avab !== undefined ? `<AVAB>${escapeXml(a.avab)}</AVAB>` : "",
		a.aeab !== undefined ? `<AEAB>${escapeXml(a.aeab)}</AEAB>` : "",
		a.kindfb !== undefined ? `<KINDFB>${a.kindfb}</KINDFB>` : "",
		a.kmb30 !== undefined ? `<KMB_30>${escapeXml(a.kmb30)}</KMB_30>` : "",
		a.kmbPart !== undefined ? `<KMB_PART>${escapeXml(a.kmbPart)}</KMB_PART>` : "",
		a.agbelP !== undefined ? `<AGBEL_P>${escapeXml(a.agbelP)}</AGBEL_P>` : "",
		a.erhPab !== undefined ? `<ERH_PAB>${escapeXml(a.erhPab)}</ERH_PAB>` : "",
		a.mehrki !== undefined ? `<MEHRKI>${escapeXml(a.mehrki)}</MEHRKI>` : "",
	];
	return `<ALLGEMEINE_DATEN>${parts.join("")}</ALLGEMEINE_DATEN>`;
}

function isRawInner(section: object): section is RawInnerSection {
	return "rawInner" in section;
}

function wrapRaw(element: string, section: RawInnerSection | undefined): string {
	if (section === undefined) return "";
	return `<${element}>${section.rawInner}</${element}>`;
}

function wahlEl(name: string, v: "J" | undefined): string {
	return v !== undefined ? `<${name}>${v}</${name}>` : "";
}

function strEl(name: string, v: string | undefined): string {
	return v !== undefined ? `<${name}>${escapeXml(v)}</${name}>` : "";
}

function intEl(name: string, v: number | undefined): string {
	return v !== undefined ? `<${name}>${v}</${name}>` : "";
}

function sonderausgabenXml(s: SonderausgabenSection | undefined): string {
	if (s === undefined) return "";
	if (isRawInner(s)) return wrapRaw("SONDERAUSGABEN", s);
	const ts = s as TypedSonderausgaben;
	// 2024 SONDERAUSGABEN sequence: KZ280 → KZ460 (reversed in 2025).
	const inner = [kzEl("KZ280", ts.kz280), kzEl("KZ460", ts.kz460)].join("");
	return `<SONDERAUSGABEN>${inner}</SONDERAUSGABEN>`;
}

function jobXml(
	elBeruf: string,
	elZrvon: string,
	elZrbis: string,
	kzPausch: string,
	j: WerbungskostenJob,
): string {
	return [
		`<${elBeruf}>${escapeXml(j.beruf)}</${elBeruf}>`,
		`<${elZrvon} type="monattag">${escapeXml(j.zrvon)}</${elZrvon}>`,
		`<${elZrbis} type="monattag">${escapeXml(j.zrbis)}</${elZrbis}>`,
		kzEl(kzPausch, j.kzPauschale),
	].join("");
}

function werbungskostenXml(w: WerbungskostenSection | undefined): string {
	if (w === undefined) return "";
	if (isRawInner(w)) return wrapRaw("WERBUNGSKOSTEN", w);
	const tw = w as TypedWerbungskosten;
	const parts = [
		kzEl("KZ718", tw.kz718),
		kzEl("KZ916", tw.kz916),
		kzEl("KZ717", tw.kz717),
		kzEl("KZ158", tw.kz158),
		kzEl("KZ274", tw.kz274),
		tw.beruf !== undefined ? `<BERUF>${escapeXml(tw.beruf)}</BERUF>` : "",
		kzEl("KZ169", tw.kz169),
		kzEl("KZ719", tw.kz719),
		kzEl("KZ720", tw.kz720),
		kzEl("KZ721", tw.kz721),
		kzEl("KZ722", tw.kz722),
		kzEl("KZ300", tw.kz300),
		kzEl("KZ723", tw.kz723),
		kzEl("KZ159", tw.kz159),
		kzEl("KZ724", tw.kz724),
		tw.job1 !== undefined ? jobXml("WKBERUF1", "WKZRVON1", "WKZRBIS1", "KZ437", tw.job1) : "",
		tw.job2 !== undefined ? jobXml("WKBERUF2", "WKZRVON2", "WKZRBIS2", "KZ438", tw.job2) : "",
	];
	return `<WERBUNGSKOSTEN>${parts.join("")}</WERBUNGSKOSTEN>`;
}

function abAllgemeinXml(s: AbAllgemeinSection | undefined): string {
	if (s === undefined) return "";
	if (isRawInner(s)) return wrapRaw("ALLGEMEIN", s);
	const t = s as TypedAbAllgemein;
	const inner = [
		kzEl("KZ730", t.kz730),
		kzEl("KZ731", t.kz731),
		kzEl("KZ734", t.kz734),
		kzEl("KZ735", t.kz735),
		kzEl("KZ475", t.kz475),
		t.opferaus !== undefined ? `<OPFERAUS>${escapeXml(t.opferaus)}</OPFERAUS>` : "",
	].join("");
	return `<ALLGEMEIN>${inner}</ALLGEMEIN>`;
}

function abBehindSelfXml(b: RawInnerSection | TypedAbBehindSelf): string {
	if (isRawInner(b)) return wrapRaw("BEHINDERUNG_STEUERPFLICHTIGER", b);
	const inner = [
		b.koerperS !== undefined ? `<KOERPER_S>${b.koerperS}</KOERPER_S>` : "",
		b.diaetSz !== undefined ? `<DIAET_S_Z>${escapeXml(b.diaetSz)}</DIAET_S_Z>` : "",
		b.diaetSg !== undefined ? `<DIAET_S_G>${escapeXml(b.diaetSg)}</DIAET_S_G>` : "",
		b.diaetSm !== undefined ? `<DIAET_S_M>${escapeXml(b.diaetSm)}</DIAET_S_M>` : "",
		b.pflegeSa !== undefined
			? `<PFLEGE_S_A type="monat">${escapeXml(b.pflegeSa)}</PFLEGE_S_A>`
			: "",
		b.pflegeSe !== undefined
			? `<PFLEGE_S_E type="monat">${escapeXml(b.pflegeSe)}</PFLEGE_S_E>`
			: "",
		b.kfzS !== undefined ? `<KFZ_S>${escapeXml(b.kfzS)}</KFZ_S>` : "",
		kzEl("KZ435", b.kz435),
		kzEl("KZ476", b.kz476),
		kzEl("KZ439", b.kz439),
	].join("");
	return `<BEHINDERUNG_STEUERPFLICHTIGER>${inner}</BEHINDERUNG_STEUERPFLICHTIGER>`;
}

function abBehindPartnerXml(b: RawInnerSection | TypedAbBehindPartner): string {
	if (isRawInner(b)) return wrapRaw("BEHINDERUNG_PARTNER", b);
	const inner = [
		b.koerperP !== undefined ? `<KOERPER_P>${b.koerperP}</KOERPER_P>` : "",
		b.diaetPz !== undefined ? `<DIAET_P_Z>${escapeXml(b.diaetPz)}</DIAET_P_Z>` : "",
		b.diaetPg !== undefined ? `<DIAET_P_G>${escapeXml(b.diaetPg)}</DIAET_P_G>` : "",
		b.diaetPm !== undefined ? `<DIAET_P_M>${escapeXml(b.diaetPm)}</DIAET_P_M>` : "",
		b.pflegePa !== undefined
			? `<PFLEGE_P_A type="monat">${escapeXml(b.pflegePa)}</PFLEGE_P_A>`
			: "",
		b.pflegePe !== undefined
			? `<PFLEGE_P_E type="monat">${escapeXml(b.pflegePe)}</PFLEGE_P_E>`
			: "",
		b.kfzP !== undefined ? `<KFZ_P>${escapeXml(b.kfzP)}</KFZ_P>` : "",
		kzEl("KZ436", b.kz436),
		kzEl("KZ417", b.kz417),
		kzEl("KZ418", b.kz418),
	].join("");
	return `<BEHINDERUNG_PARTNER>${inner}</BEHINDERUNG_PARTNER>`;
}

function abBehinderungXml(s: AbBehinderungSection | undefined): string {
	if (s === undefined) return "";
	if (isRawInner(s)) return wrapRaw("BEHINDERUNG", s);
	const t = s as TypedAbBehinderung;
	const inner = [
		t.steuerpflichtiger !== undefined ? abBehindSelfXml(t.steuerpflichtiger) : "",
		t.partner !== undefined ? abBehindPartnerXml(t.partner) : "",
	].join("");
	return `<BEHINDERUNG>${inner}</BEHINDERUNG>`;
}

function fbMonthXml(month: number, m: import("./types.js").FbMonth): string {
	const parts = [
		m.s !== undefined ? `<FB${month}_S>${m.s}</FB${month}_S>` : "",
		m.p !== undefined ? `<FB${month}_P>${m.p}</FB${month}_P>` : "",
		m.u !== undefined ? `<FB${month}_U>${m.u}</FB${month}_U>` : "",
		m.fb50 !== undefined ? `<FB${month}_50>${m.fb50}</FB${month}_50>` : "",
		m.fb100 !== undefined ? `<FB${month}_100>${m.fb100}</FB${month}_100>` : "",
	];
	return parts.join("");
}

function kindAngabenXml(k: RawInnerSection | TypedKindAngaben): string {
	if (isRawInner(k)) return wrapRaw("KIND_ANGABEN", k);
	const monateXml: string[] = [];
	if (k.fbMonate !== undefined) {
		for (let m = 1; m <= 12; m++) {
			const entry = (k.fbMonate as Record<string, import("./types.js").FbMonth | undefined>)[
				String(m)
			];
			if (entry !== undefined) monateXml.push(fbMonthXml(m, entry));
		}
	}
	const parts = [
		k.famname !== undefined ? `<FAMNAME>${escapeXml(k.famname)}</FAMNAME>` : "",
		k.vorname !== undefined ? `<VORNAME>${escapeXml(k.vorname)}</VORNAME>` : "",
		k.vnrkinK !== undefined ? `<VNRKIN_K>${escapeXml(k.vnrkinK)}</VNRKIN_K>` : "",
		k.gebkinK !== undefined ? `<GEBKIN_K type="datum">${escapeXml(k.gebkinK)}</GEBKIN_K>` : "",
		k.eurokv !== undefined ? `<EUROKV>${escapeXml(k.eurokv)}</EUROKV>` : "",
		k.wsKind !== undefined ? `<WS_KIND>${escapeXml(k.wsKind)}</WS_KIND>` : "",
		wahlEl("FBSN_50", k.fbsn50),
		wahlEl("FBSN_100", k.fbsn100),
		wahlEl("FBPN_50", k.fbpn50),
		wahlEl("FBPN_100", k.fbpn100),
		wahlEl("FBSU_50", k.fbsu50),
		wahlEl("FBSU_100", k.fbsu100),
		wahlEl("UAB_50", k.uab50),
		wahlEl("UAB_100", k.uab100),
		kzEl("UNT_GES", k.untGes),
		kzEl("UNT_MTL", k.untMtl),
		kzEl("UNTAUSL", k.untausl),
		k.auslKa !== undefined ? `<AUSL_K_A type="monat">${escapeXml(k.auslKa)}</AUSL_K_A>` : "",
		k.auslKe !== undefined ? `<AUSL_K_E type="monat">${escapeXml(k.auslKe)}</AUSL_K_E>` : "",
		kzEl("AGBEL_K", k.agbelK),
		intEl("KOSTRA_K", k.kostraK),
		intEl("MMBERU_K", k.mmberuK),
		k.plzK !== undefined ? `<PLZ_K>${escapeXml(k.plzK)}</PLZ_K>` : "",
		k.staatK !== undefined ? `<STAAT_K>${escapeXml(k.staatK)}</STAAT_K>` : "",
		intEl("KOERPER_K", k.koerperK),
		wahlEl("DIAET_K_Z", k.diaetKz),
		wahlEl("DIAET_K_G", k.diaetKg),
		wahlEl("DIAET_K_M", k.diaetKm),
		k.fberhKa !== undefined ? `<FBERH_K_A type="monat">${escapeXml(k.fberhKa)}</FBERH_K_A>` : "",
		k.fberhKe !== undefined ? `<FBERH_K_E type="monat">${escapeXml(k.fberhKe)}</FBERH_K_E>` : "",
		kzEl("PFLEGE_K", k.pflegeK),
		k.pflegeKa !== undefined
			? `<PFLEGE_K_A type="monat">${escapeXml(k.pflegeKa)}</PFLEGE_K_A>`
			: "",
		k.pflegeKe !== undefined
			? `<PFLEGE_K_E type="monat">${escapeXml(k.pflegeKe)}</PFLEGE_K_E>`
			: "",
		kzEl("KZ28_K", k.kz28k),
		kzEl("KZ71_K", k.kz71k),
		kzEl("KZ29_K", k.kz29k),
		kzEl("NVSTAGZ", k.nvstagz),
		monateXml.join(""),
	];
	return `<KIND_ANGABEN>${parts.join("")}</KIND_ANGABEN>`;
}

function kindAusbildungBehinderungXml(s: KindAusbildungBehinderungSection | undefined): string {
	if (s === undefined) return "";
	if (isRawInner(s)) return wrapRaw("KIND_AUSBILDUNG_BEHINDERUNG", s);
	const t = s as TypedKindAusbildungBehinderung;
	const inner = t.kindAngaben.map(kindAngabenXml).join("");
	return `<KIND_AUSBILDUNG_BEHINDERUNG>${inner}</KIND_AUSBILDUNG_BEHINDERUNG>`;
}

function aussergewoehnlicheBelastungenXml(
	s: AussergewoehnlicheBelastungenSection | undefined,
): string {
	if (s === undefined) return "";
	if (isRawInner(s)) return wrapRaw("AUSSERGEWOEHNLICHE_BELASTUNGEN", s);
	const t = s as TypedAussergewoehnlicheBelastungen;
	const inner = [
		abAllgemeinXml(t.allgemein),
		abBehinderungXml(t.behinderung),
		kindAusbildungBehinderungXml(t.kindAusbildungBehinderung),
	].join("");
	return `<AUSSERGEWOEHNLICHE_BELASTUNGEN>${inner}</AUSSERGEWOEHNLICHE_BELASTUNGEN>`;
}

function freibetragsbescheidXml(s: FreibetragsbescheidSection | undefined): string {
	if (s === undefined) return "";
	if (isRawInner(s)) return wrapRaw("FREIBETRAGSBESCHEID", s);
	const t = s as TypedFreibetragsbescheid;
	const inner = [
		t.indfb !== undefined ? `<INDFB>${escapeXml(t.indfb)}</INDFB>` : "",
		kzEl("KZ449", t.kz449),
	].join("");
	return `<FREIBETRAGSBESCHEID>${inner}</FREIBETRAGSBESCHEID>`;
}

function besondereSonderausgabenVerteilungXml(
	s: BesondereSonderausgabenVerteilungSection | undefined,
): string {
	if (s === undefined) return "";
	if (isRawInner(s)) return wrapRaw("BESONDERE_SONDERAUSGABEN_VERTEILUNG", s);
	const t = s as TypedBesondereSonderausgabenVerteilung;
	// 2024 sequence (re-ordered in 2025; KZ117/KZ118 added in 2025).
	const inner = [
		t.famD !== undefined ? `<FAM_D>${escapeXml(t.famD)}</FAM_D>` : "",
		t.vorD !== undefined ? `<VOR_D>${escapeXml(t.vorD)}</VOR_D>` : "",
		t.vnrD !== undefined ? `<VNR_D>${escapeXml(t.vnrD)}</VNR_D>` : "",
		t.gebdatD !== undefined ? `<GEBDAT_D type="datum">${escapeXml(t.gebdatD)}</GEBDAT_D>` : "",
		kzEl("KZ458", t.kz458),
		t.zus1D !== undefined ? `<ZUS1_D>${escapeXml(t.zus1D)}</ZUS1_D>` : "",
		kzEl("KZ281", t.kz281),
		kzEl("KZ282", t.kz282),
		kzEl("KZ283", t.kz283),
		t.zehn1D !== undefined ? `<ZEHN1_D>${escapeXml(t.zehn1D)}</ZEHN1_D>` : "",
		kzEl("KZ284", t.kz284),
		t.zehn2D !== undefined ? `<ZEHN2_D>${escapeXml(t.zehn2D)}</ZEHN2_D>` : "",
		t.zus2D !== undefined ? `<ZUS2_D>${escapeXml(t.zus2D)}</ZUS2_D>` : "",
	].join("");
	return `<BESONDERE_SONDERAUSGABEN_VERTEILUNG>${inner}</BESONDERE_SONDERAUSGABEN_VERTEILUNG>`;
}

function internationalXml(s: InternationalSection | undefined): string {
	if (s === undefined) return "";
	if (isRawInner(s)) return wrapRaw("INTERNATIONAL", s);
	const t = s as TypedInternational;
	const parts = [
		wahlEl("WS_INL", t.wsInl),
		wahlEl("GREG1614", t.greg1614),
		wahlEl("WS_AUSAG", t.wsAusag),
		wahlEl("AUSLBEH", t.auslbeh),
		wahlEl("AUSLBEZ", t.auslbez),
		wahlEl("INL_BON", t.inlBon),
		wahlEl("DBANRECH", t.dbanrech),
		wahlEl("AUSL_NSA", t.auslNsa),
		wahlEl("WS_AUSL", t.wsAusl),
		wahlEl("AGLST", t.aglst),
		wahlEl("INLBEZ", t.inlbez),
		wahlEl("AUSAG", t.ausag),
		wahlEl("AUSL_BON", t.auslBon),
		strEl("STAAT_3", t.staat3),
		wahlEl("ANS_BSG", t.ansBsg),
		wahlEl("AUSL_EIN", t.auslEin),
		kzEl("KZ359", t.kz359),
		wahlEl("PENSAUSL", t.pensausl),
		kzEl("KZ183", t.kz183),
		kzEl("KZ377", t.kz377),
		intEl("ANZL17", t.anzl17),
		kzEl("KZ187", t.kz187),
		kzEl("KZ154", t.kz154),
		kzEl("KZ544", t.kz544),
		strEl("LAND1_L1", t.land1L1),
		kzEl("WK1_L1", t.wk1L1),
		kzEl("AUSLST1", t.auslst1),
		strEl("LAND2_L1", t.land2L1),
		kzEl("WK2_L1", t.wk2L1),
		kzEl("AUSLST2", t.auslst2),
		wahlEl("AUSNEIN", t.ausnein),
		wahlEl("AUSERH", t.auserh),
		wahlEl("AUSANTR", t.ausantr),
		kzEl("KZ775", t.kz775),
		kzEl("KZ453", t.kz453),
		kzEl("KZ184", t.kz184),
		t.sv184 !== undefined ? `<SV_184>${escapeXml(t.sv184)}</SV_184>` : "",
		kzEl("KZ493", t.kz493),
		kzEl("KZ791", t.kz791),
		wahlEl("ANTR9911", t.antr9911),
		wahlEl("BESCHPFL", t.beschpfl),
		wahlEl("KEINWS", t.keinws),
		strEl("AS_STAAT", t.asStaat),
		strEl("STAAT_AN", t.staatAn),
		wahlEl("ANTR14", t.antr14),
		kzEl("EINK_S", t.einkS),
		kzEl("EINK_AND", t.einkAnd),
		kzEl("EINK_P", t.einkP),
		kzEl("KZ188", t.kz188),
		wahlEl("STS_275", t.sts275),
	];
	return `<INTERNATIONAL>${parts.join("")}</INTERNATIONAL>`;
}

function erklaerungXml(e: Erklaerung): string {
	const parts = [
		`<SATZNR>${e.satznr}</SATZNR>`,
		allgemeinXml(e.allgemein),
		sonderausgabenXml(e.sonderausgaben),
		werbungskostenXml(e.werbungskosten),
		aussergewoehnlicheBelastungenXml(e.aussergewoehnlicheBelastungen),
		freibetragsbescheidXml(e.freibetragsbescheid),
		internationalXml(e.international),
		besondereSonderausgabenVerteilungXml(e.besondereSonderausgabenVerteilung),
	];
	return `<ERKLAERUNG art="${escapeXml(e.art)}">${parts.join("")}</ERKLAERUNG>`;
}

export interface BuildOptions {
	validate?: boolean;
}

/**
 * Build an L1 (ANV) 2024 `<ERKLAERUNGS_UEBERMITTLUNG>` payload from a typed body.
 * The output is a complete UTF-8 XML document; pass it as the `data` field of
 * a fileupload SOAP call with `art: "L1"`.
 */
export function build(body: L1Body, opts: BuildOptions = {}): string {
	if (opts.validate !== false) {
		const result = l1Body.safeParse(body);
		if (!result.success) {
			throw new ValidationError(
				"L1 2024 body failed validation",
				result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
			);
		}
	}
	const erklaerungen = body.erklaerungen.map(erklaerungXml).join("");
	return `<?xml version="1.0" encoding="UTF-8"?><ERKLAERUNGS_UEBERMITTLUNG>${infoXml(body.info)}${erklaerungen}</ERKLAERUNGS_UEBERMITTLUNG>`;
}
