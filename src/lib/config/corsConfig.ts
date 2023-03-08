export function setCorsOptions() {
	return {
		allowedHeaders: ['Authorization', 'Content-Type'],
		credentials: true,
		origin: /\.civilservice\.gov\.uk$/,
	}
}
