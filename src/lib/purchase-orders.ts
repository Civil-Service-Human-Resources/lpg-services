import axios from 'axios'
import * as axiosLogger from 'lib/axiosLogger'
import * as log4js from 'log4js'
import * as config from './config'
import * as model from './model'

const logger = log4js.getLogger('purchase-orders')

const http = axios.create({
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
			`/purchase-orders/?department=${user.department}&moduleId=${moduleId}`,
			{
				headers: {
					Authorization: `Bearer ${user.accessToken}`,
				},
				validateStatus: status => {
					return status === 200 || status === 404
				},
			}
		)
		if (response && response.data) {
			return response.data
		}
	} catch (e) {
		logger.error('Error searching for call off PO, ignoring', e)
	}
}

export async function listAll(user: model.User) {
	logger.debug('Listing all purchase orders')
	const response = await http.get(`/purchase-orders`, {headers: {Authorization: `Bearer ${user.accessToken}`}})
	return response.data.content
}

export async function get(id: string, user: model.User) {
	logger.debug(`Getting purchase order with id ${id}`)
	return (await http.get(`/purchase-orders/${id}`, {headers: {Authorization: `Bearer ${user.accessToken}`}})).data
}

export async function save(purchaseOrder: any, user: model.User) {
	await http.post(`/purchase-orders`, purchaseOrder, {headers: {Authorization: `Bearer ${user.accessToken}`}})
}
