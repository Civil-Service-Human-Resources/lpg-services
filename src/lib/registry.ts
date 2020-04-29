import axios, {AxiosResponse} from 'axios'
import * as https from 'https'
import * as config from 'lib/config'
import {User} from 'lib/model'
import * as log4js from 'log4js'
import * as traverson from 'traverson'
import * as hal from 'traverson-hal'

const logger = log4js.getLogger('registry')

const http = axios.create({
	baseURL: config.CHECK_LINEMANAGER_URL,
	headers: {
		'Content-Type': 'application/json',
	},
	httpsAgent: new https.Agent({
		keepAlive: true,
		maxFreeSockets: 15,
		maxSockets: 100,
	}),
	timeout: config.REQUEST_TIMEOUT,
})

const httpCsrs = axios.create({
	baseURL: config.REGISTRY_SERVICE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
	timeout: config.REQUEST_TIMEOUT,
})

// register the traverson-hal plug-in for media type 'application/hal+json'
traverson.registerMediaType(hal.mediaType, hal)

export async function get(node: string): Promise<{}> {
	const result = await new Promise((resolve, reject) =>
		traverson
			.from(config.REGISTRY_SERVICE_URL)
			.jsonHal()
			.follow(node, 'self')
			.withRequestOptions({
				qs: {size: 100, page: 0},
			})
			.getResource((error, document) => {
				if (error) {
					reject(false)
				} else {
					resolve(document)
				}
			})
	)

	return result as any[]
}

export async function halNode(node: string): Promise<any[]> {
	const result = await get(node)
	return (result as any)._embedded[node]
}

export async function follow(path: string, nodes: string[], templateParameters?: any) {
	if (nodes.length === 0) {
		nodes = ['self']
	}

	const first = nodes[0]
	nodes.shift()

	const result = await new Promise((resolve, reject) => {
		const builder = traverson
			.from(path)
			.jsonHal()
			.follow(first, ...nodes)

		if (templateParameters) {
			builder.withTemplateParameters(templateParameters!)
		}

		builder.getResource((error, document) => {
			if (error) {
				logger.error(error)
				reject(false)
			} else {
				resolve(document)
			}
		})
	})

	return result
}

export async function checkLineManager(data: any, token: string) {
	const result = await new Promise((resolve, reject) => {
		http
			.patch(`?email=${data.lineManager}`, null, {
				headers: {Authorization: `Bearer ${token}`},
			})
			.then((response: any) => {
				resolve(response)
			})
			.catch((error: any) => {
				resolve(error.response)
			})
	})
	return result
}

export async function getForceOrgResetFlag(token: string) {
	const result = await new Promise<boolean>((resolve, reject) => {
		httpCsrs
			.get(`/civilServants/org/reset`, {
				headers: {Authorization: `Bearer ${token}`},
			})
			.then((response: any) => {
				resolve(response)
			})
			.catch((error: any) => {
				resolve(error.response)
			})
	})
	return result
}

export async function updateForceOrgResetFlag(user: User, data: any) {
	const result = await new Promise((resolve, reject) => {
		httpCsrs
			.patch(`/civilServants/org/reset`, data, {
				headers: {Authorization: `Bearer ${user.accessToken}`},
			})
			.then((response: any) => {
				resolve(response)
			})
			.catch((error: any) => {
				resolve(error.response)
			})
	})
	return result
}

export async function getOrgCode(token: string) {
	const result = await new Promise((resolve, reject) => {
		httpCsrs
			.get(`/civilServants/org`, {
				headers: {Authorization: `Bearer ${token}`},
			})
			.then((response: any) => {
				resolve(response)
			})
			.catch((error: any) => {
				resolve(error.response)
			})
	})
	return result
}

export async function getAgencyTokenForUser(user: User, orgCode: string, domain: string) {
	const token = user.accessToken

	return await new Promise(resolve => {
		httpCsrs
			.get(`/agencyTokens?domain=${domain}&code=${orgCode}`, {
				headers: {Authorization: `Bearer ${token}`},
			})
			.then((response: any) => {
				resolve(response)
			})
			.catch((error: any) => {
				resolve(error.response)
			})
	})
}

export async function updateAvailableSpacesOnAgencyToken(token: string, data: any) {
	const result = new Promise((resolve, reject) => {
		httpCsrs
			.put(`/agencyTokens`, data, {
				headers: {Authorization: `Bearer ${token}`},
			})
			.then((response: any) => {
				resolve(response)
			})
			.catch((error: any) => {
				resolve(error.response)
			})
	})
	return result
}

export async function patch(node: string, data: any, token: string) {
	const result = await new Promise((resolve, reject) =>
		traverson
			.from(config.REGISTRY_SERVICE_URL)
			.jsonHal()
			.follow(node, 'me', 'self')
			.withRequestOptions({
				auth: {
					bearer: token,
				},
			})
			.patch(data, (error, response) => {
				if (error) {
					resolve(false)
				} else {
					if (response.statusCode >= 200 && response.statusCode < 300) {
						resolve(true)
					} else {
						reject(false)
					}
				}
			})
	)

	return result
}

export async function profile(token: string) {
	return await new Promise((resolve, reject) =>
		traverson
			.from(config.REGISTRY_SERVICE_URL)
			.jsonHal()
			.follow('civilServants', 'me')
			.withRequestOptions({
				auth: {
					bearer: token,
				},
			})
			.getResource((error, document) => {
				if (error) {
					reject(error)
				} else {
					resolve(document)
				}
			})
	)
}

export async function getWithoutHal(path: string): Promise<AxiosResponse> {
	try {
		return await http.get(config.REGISTRY_SERVICE_URL + path)
	} catch (error) {
		throw new Error(error)
	}
}

export async function isTokenizedUser(code: string, domain: string) {
	let tokenziedUser = false
	await http
		.get(config.REGISTRY_SERVICE_URL + `/agencyTokens`, {
			params: {
				code,
				domain,
			},
		})
		.then(e => {
			if (e.status === 200) {
				tokenziedUser = true
			} else {
				tokenziedUser = false
			}
		})

	return tokenziedUser
}

export async function isValidToken(code: string, domain: string, token: string) {
	let validToken = false
	await http
		.get(config.REGISTRY_SERVICE_URL + `/agencyTokens`, {
			params: {
				code,
				domain,
				token,
			},
		})
		.then(e => {
			if (e.status === 200) {
				validToken = true
			} else {
				validToken = false
			}
		})
	return validToken
}

export async function updateToken(
	code: string,
	domain: string,
	token: string,
	removeUser: boolean,
	accessToken: string
) {
	const data = JSON.stringify({
		code,
		domain,
		removeUser,
		token,
	})

	const result = new Promise((resolve, reject) => {
		httpCsrs
			.put(config.REGISTRY_SERVICE_URL + `/agencyTokens`, data, {
				headers: {Authorization: `Bearer ${accessToken}`},
			})
			.then((response: any) => {
				resolve(response)
			})
			.catch((error: any) => {
				resolve(error.response)
			})
	})
	return result
}
