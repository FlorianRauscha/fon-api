export class FonError extends Error {
	override readonly name: string = "FonError";
	constructor(message: string, cause?: unknown) {
		super(message, cause !== undefined ? { cause } : undefined);
	}
}

export class NetworkError extends FonError {
	override readonly name = "NetworkError";
}

export class SoapFaultError extends FonError {
	override readonly name = "SoapFaultError";
	constructor(
		message: string,
		readonly status: number,
		readonly body: string,
	) {
		super(message);
	}
}

export class MaintenanceError extends FonError {
	override readonly name = "MaintenanceError";
	constructor(readonly body: string) {
		super("FinanzOnline is in maintenance mode (Wartungsarbeiten)");
	}
}

export class InvalidXmlError extends FonError {
	override readonly name = "InvalidXmlError";
	constructor(
		message: string,
		readonly body: string,
	) {
		super(message);
	}
}

export class ReturncodeError extends FonError {
	override readonly name: string = "ReturncodeError";
	constructor(
		readonly rc: number,
		readonly msg: string,
	) {
		super(`FinanzOnline returncode ${rc}: ${msg}`);
	}
}

export class SessionExpiredError extends ReturncodeError {
	override readonly name = "SessionExpiredError";
}

export class InvalidCredentialsError extends ReturncodeError {
	override readonly name = "InvalidCredentialsError";
}

export class NotAuthorizedError extends ReturncodeError {
	override readonly name = "NotAuthorizedError";
}

export class ValidationError extends FonError {
	override readonly name = "ValidationError";
	constructor(
		message: string,
		readonly issues: ReadonlyArray<{ path: string; message: string }>,
	) {
		super(message);
	}
}
