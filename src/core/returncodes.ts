import {
	InvalidCredentialsError,
	NotAuthorizedError,
	ReturncodeError,
	SessionExpiredError,
} from "./errors.js";

export const RC_DESCRIPTIONS: Readonly<Record<number, string>> = {
	0: "Aufruf ok",
	[-1]: "Die Session ID ist ungültig oder abgelaufen.",
	[-2]: "Der Aufruf des Webservices ist derzeit wegen Wartungsarbeiten nicht möglich.",
	[-3]: "Es ist ein technischer Fehler aufgetreten.",
	[-4]: "Dieser Teilnehmer ist für diese Funktion nicht berechtigt.",
	[-5]: "Die eingegebene Fastnr ist ungültig.",
	[-6]: "Der Zeitraum muss zwischen dem laufenden Jahr - 7 und dem laufenden Jahr liegen. Erstmaliger Zeitraum ist 2016.",
	[-7]: "Nicht zur Abfrage der eingegebenen Fastnr berechtigt.",
};

export function describeRc(rc: number): string {
	return RC_DESCRIPTIONS[rc] ?? `Unknown returncode ${rc}`;
}

export function rcToError(rc: number, msg?: string): ReturncodeError {
	const message = msg ?? describeRc(rc);
	switch (rc) {
		case -1:
			return new SessionExpiredError(rc, message);
		case -4:
			return new InvalidCredentialsError(rc, message);
		case -7:
			return new NotAuthorizedError(rc, message);
		default:
			return new ReturncodeError(rc, message);
	}
}
