import axios, {AxiosInstance, AxiosResponse} from 'axios'
import {NotificationServiceConfig} from './notificationServiceConfig'

export class NotificationService {
	/* tslint:disable:variable-name */
	private _http: AxiosInstance

	constructor(config: NotificationServiceConfig) {
		this._http = axios.create({
			baseURL: config.url,
			timeout: config.timeout,
		})
	}

	async sendEmail(templateId: string, email: string, personalisation: object, accessToken: string):
		Promise<AxiosResponse> {
		try {
			return await this._http.post('/notifications/email', {
				personalisation,
				recipient: email,
				templateId,
			}, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
				validateStatus: status => {
					return status === 200
				},
			})
		} catch (error) {
			throw new Error(`Unable to send message: ${error}`)
		}
	}

	set http(value: AxiosInstance) {
		this._http = value
	}
}
