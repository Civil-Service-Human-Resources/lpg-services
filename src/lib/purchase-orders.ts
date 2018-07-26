import axios from 'axios'
import * as axiosLogger from 'lib/axiosLogger'
import * as log4js from 'log4js'
import * as config from './config'
import * as model from './model'

const logger = log4js.getLogger('purchase-orders')

const http = axios.create({
	auth: config.COURSE_CATALOGUE.auth,
	baseURL: config.COURSE_CATALOGUE.url,
	headers: {
		'Content-Type': 'application/json',
	},
	timeout: config.REQUEST_TIMEOUT,
})

axiosLogger.axiosRequestLogger(http, logger)
axiosLogger.axiosResponseLogger(http, logger)

export async function findPurchaseOrder(user: model.User, moduleId: string) {
	try {
		const response = await http.get(
			`/purchase-orders?department=${user.department}&moduleId=${moduleId}`
		)
		if (response && response.data) {
			return response.data
		}
	} catch (e) {
		logger.info('Error searching for call off PO, ignoring', e)
	}
	return null
}

export async function listAll() {
	logger.debug('Listing all purchase orders')
	const response = await http.get(`/purchase-orders`)
	return response.data.content
}

export async function get(id: string) {
	logger.debug(`Getting purchase order with id ${id}`)
	return (await http.get(`/purchase-orders/${id}`)).data
}

export async function save(purchaseOrder: any) {
	await http.post(`/purchase-orders`, purchaseOrder)
}
