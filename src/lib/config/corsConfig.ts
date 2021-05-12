export function setCorsOptions() {
	return {
		allowedHeaders: ['Authorization', 'Content-Type', 'X-Experience-API-Version'],
		credentials: true,
		origin: /\.civilservice\.gov\.uk$/,
	}
}
