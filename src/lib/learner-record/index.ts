/* tslint:disable */
import axios, {AxiosInstance} from 'axios'

import {LearnerRecordConfig} from './learnerRecordConfig'
import {Booking} from './model/booking'

export class Index {
	private _http: AxiosInstance

	constructor(http: AxiosInstance, config: LearnerRecordConfig) {
		this._http = axios.create({
			baseURL: config.uri,
			timeout: 15000
		})
	}

	async bookEvent(booking: Booking, accessToken: string) {
		try {
			const response = await this._http.post('/booking', booking, {
				headers: {'Authorization': `Bearer ${accessToken}`}
			})
			return response.data as Booking
		}
		catch (error) {
			throw new Error(`Unable to book event: ${error}`)
		}
	}
}