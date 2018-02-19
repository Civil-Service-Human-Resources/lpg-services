declare module 'notifications-node-client' {
	export class NotifyClient {
		constructor(apiKey: string)
		sendEmail(
			templateId: string,
			emailAddress: string,
			data: {personalisation: any}
		): Promise<any>
	}
}
