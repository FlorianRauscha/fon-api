export const NAMESPACES = {
	soap: "http://schemas.xmlsoap.org/soap/envelope/",
	session: "https://finanzonline.bmf.gv.at/fon/ws/session",
	abfrage: "https://finanzonline.bmf.gv.at/fon/ws/abfrageDatenuebermittlung",
	fileupload: "https://finanzonline.bmf.gv.at/fon/ws/fileupload",
} as const;

export const ENDPOINTS = {
	session: "https://finanzonline.bmf.gv.at:443/fonws/ws/session",
	abfrage: "https://finanzonline.bmf.gv.at/fon/ws/abfrageDatenuebermittlung",
	fileupload: "https://finanzonline.bmf.gv.at/fon/ws/fileupload",
} as const;

export const SOAP_ACTIONS = {
	login: "login",
	logout: "logout",
	abfrageDatenuebermittlung: "abfrageDatenuebermittlung",
	upload: "upload",
} as const;

export const TEST_CREDENTIALS = {
	tid: "1000103u3032",
	benid: "webserv99",
	pin: "webserv99",
} as const;
