export const UPLOAD_ARTEN = [
	"U30",
	"JAHR_ERKL",
	"L1",
	"KOM",
	"SB",
	"108",
	"108AB",
	"U13",
	"JAB",
	"IVF",
	"RZ",
	"DUE",
	"UEB",
	"FVAN",
	"ZEAN",
	"SBS",
	"KOMU",
	"EUST",
	"TVW",
	"SBZ",
	"BIL",
	"VAT",
	"VATAB",
	"BET",
	"LFH",
	"FPH",
	"NOVA",
	"STAB",
	"KA1",
	"KDUEB",
	"UEB_SA",
	"VPDGD",
	"107",
	"107AB",
	"SOER",
	"DIGI",
] as const;

export type UploadArt = (typeof UPLOAD_ARTEN)[number];

/** Test (T) submissions are non-binding; Production (P) submissions are filed for real. */
export type Uebermittlung = "T" | "P";

export interface UploadRequest {
	tid: string;
	benid: string;
	id: string;
	art: UploadArt;
	uebermittlung: Uebermittlung;
	/** The XML payload string (already conforming to the per-art, per-year schema). */
	data: string;
}

export interface UploadResult {
	rc: number;
	msg: string;
	/**
	 * Best-effort parse of `msg` into a typed BMF protocol response. `undefined`
	 * when the server returned a non-protocol message (e.g. a maintenance HTML
	 * blob, or a bare error string the parser couldn't recognise).
	 */
	parsed?: import("./protocol.js").ProtocolResult;
}
