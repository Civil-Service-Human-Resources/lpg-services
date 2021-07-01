import {AxiosInstance} from 'axios'
import {Logger} from 'winston'

export function axiosRequestLogger(
	axiosInstance: AxiosInstance,
	logger: Logger
) {
	axiosInstance.interceptors.request.use(
		config => {
			// Do something before request is sent
			logger.debug(
				`Outgoing ${config.method!.toUpperCase()} request`,
				`to: ${config.baseURL}${config.url}`,
				`\n data sent:${JSON.stringify(config.data)}`
			)
			return config
		},
		error => {
			// Do something with request error
			logger.error(`Error with request:`, error)
			return Promise.reject(error)
		}
	)
}

export function axiosResponseLogger(
	axiosInstance: AxiosInstance,
	logger: Logger
) {
	// Add a response interceptor
	axiosInstance.interceptors.response.use(
		response => {
			logger.debug('response data:', response)
			return response
		},
		error => {
			// Do something with response error
			logger.error(
				`Error with external service: ${error.config.baseURL}`,
				error
			)

			return Promise.reject(error)
		}
	)
}
