import {AxiosResponse, default as axios} from 'axios'
import * as config from 'extension/config'
import * as https from 'https'

export interface QueryUser {
	Resources: User[]
}

export interface User {
	created: string
	id: string
	lastModified: string
	userName: string
}

const SCIM2_HEADERS: Record<string, string> = {
	Accept: 'application/json',
}
SCIM2_HEADERS['Content-Type'] = 'application/json'

const http = axios.create({
	httpsAgent: new https.Agent({
		rejectUnauthorized: false,
	}),
})

export async function createUser(username: string, password: string) {
	const url = config.WSO2_URL + '/scim2/Users/'
	const data = JSON.stringify({
		emails: [
			{
				primary: true,
				type: 'work',
				value: username,
			},
		],
		password,
		userName: username,
	})
	let resp: AxiosResponse<User>
	try {
		resp = await http.post(url, data, {
			auth: {
				password: config.WSO2_ADMIN_PASSWORD,
				username: config.WSO2_ADMIN_USERNAME,
			},
			headers: SCIM2_HEADERS,
			method: 'POST',
		})
	} catch (err) {
		throw err
	}
	if (resp.status !== 201) {
		throw new Error(
			`Received response code ${resp.status} when expecting a 201`
		)
	}
	return resp.data.id
}

//TODO (Will) Fix this
export async function deleteUser(userid: string) {
	const url = config.WSO2_URL + '/scim2/Users/' + userid
	let resp: AxiosResponse<QueryUser>
	try {
		resp = await http.delete(url, {
			auth: {
				password: config.WSO2_ADMIN_PASSWORD,
				username: config.WSO2_ADMIN_USERNAME,
			},
			headers: {Accept: 'application/json'},
			method: 'DELETE',
		})
	} catch (err) {
		throw err
	}
	if (resp.status !== 204) {
		throw new Error(
			`Received response code ${resp.status} when expecting a 204`
		)
	}
}

export async function getUser(username: string) {
	const url =
		config.WSO2_URL +
		'/scim2/Users/?filter=userName+Eq+' +
		encodeURIComponent(username)
	let resp: AxiosResponse<QueryUser>
	try {
		resp = await http.get(url, {
			auth: {
				password: config.WSO2_ADMIN_PASSWORD,
				username: config.WSO2_ADMIN_USERNAME,
			},
			headers: {Accept: 'application/json'},
			method: 'GET',
		})
	} catch (err) {
		throw err
	}
	if (resp.status !== 200) {
		throw new Error(
			`Received response code ${resp.status} when expecting a 200`
		)
	}
	if (!resp.data.Resources.length) {
		throw new Error(`Unable to find user ${username} from service`)
	}
	return resp.data.Resources[0]
}

export async function updateUser(
	userid: string,
	username: string,
	firstname: string,
	department: string,
	profession: string,
	grade: string
) {
	const url = config.WSO2_URL + '/scim2/Users/' + userid
	const data = JSON.stringify({
		CshrUser: {department, grade, profession},
		name: {givenName: firstname},
		userName: username,
	})
	let resp: AxiosResponse<User>
	try {
		resp = await http.put(url, data, {
			auth: {
				password: config.WSO2_ADMIN_PASSWORD,
				username: config.WSO2_ADMIN_USERNAME,
			},
			headers: SCIM2_HEADERS,
			method: 'PUT',
		})
	} catch (err) {
		throw err
	}
	if (resp.status !== 200) {
		throw new Error(
			`Received response code ${resp.status} when expecting a 200`
		)
	}
}
