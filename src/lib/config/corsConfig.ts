import * as config from "lib/config/index"

export function setCorsOptions() {
	let corsOptions = {}
	if (config.PROFILE === 'prod') {
		corsOptions = {
			allowedHeaders: ['Authorization', 'Content-Type', 'X-Experience-API-Version'],
			credentials: true,
			origin: /\.civilservice\.gov\.uk$/,
		}
	} else {
		corsOptions = {
			allowedHeaders: ['Authorization', 'Content-Type', 'X-Experience-API-Version'],
			credentials: true,
			origin: /\.cshr\.digital$/,
		}
	}
	return corsOptions
}
