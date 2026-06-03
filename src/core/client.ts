import { abfrageDatenuebermittlung } from "../abfrage/index.js";
import type { AbfrageRequest, AbfrageResult } from "../abfrage/types.js";
import { upload } from "../upload/index.js";
import type { UploadRequest, UploadResult } from "../upload/types.js";
import {
	type Credentials,
	type SessionLogin,
	type SessionTransport,
	login,
	logout,
} from "./session.js";

export interface FonClientOptions extends Credentials {
	transport?: SessionTransport;
}

export class FonClient {
	private session: SessionLogin | null = null;

	constructor(private readonly opts: FonClientOptions) {}

	async login(): Promise<SessionLogin> {
		if (this.session) return this.session;
		this.session = await login(
			{
				tid: this.opts.tid,
				benid: this.opts.benid,
				pin: this.opts.pin,
				herstellerid: this.opts.herstellerid,
			},
			this.opts.transport,
		);
		return this.session;
	}

	/**
	 * Inject a pre-existing BMF session — bypasses `login()` for the duration of
	 * this client's lifetime. Useful for the CLI's persisted-session flow:
	 * `fon-api login` writes a token to disk, subsequent commands load it and
	 * inject it here so they don't re-authenticate per call.
	 */
	useSession(session: SessionLogin): void {
		this.session = session;
	}

	async logout(): Promise<void> {
		if (!this.session) return;
		await logout(this.session, this.opts.transport);
		this.session = null;
	}

	async abfrage(req: Omit<AbfrageRequest, "tid" | "benid" | "id">): Promise<AbfrageResult> {
		const s = await this.login();
		return abfrageDatenuebermittlung(
			{ ...req, tid: s.tid, benid: s.benid, id: s.id },
			this.opts.transport,
		);
	}

	async upload(req: Omit<UploadRequest, "tid" | "benid" | "id">): Promise<UploadResult> {
		const s = await this.login();
		return upload({ ...req, tid: s.tid, benid: s.benid, id: s.id }, this.opts.transport);
	}
}

export function createClient(opts: FonClientOptions): FonClient {
	return new FonClient(opts);
}
