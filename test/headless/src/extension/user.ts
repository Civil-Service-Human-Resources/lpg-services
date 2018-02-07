import { default as axios, AxiosResponse } from 'axios'
import * as https from 'https'

const { ADMIN_URL = '', ADMIN_USERNAME = '', ADMIN_PASSWORD = '' } = process.env

export interface User {
	created: string
	id: string
	lastModified: string
	userName: string
}

export interface QueryUser {
	Resources: User[]
}

const http = axios.create({
	httpsAgent: new https.Agent({
		rejectUnauthorized: false,
	}),
})

export async function createUser(username: string, password: string) {
	const url = ADMIN_URL + '/scim2/Users/'
	const data = JSON.stringify({
		userName: username,
		password: password,
		emails: [
			{
				primary: true,
				value: username,
				type: 'work',
			},
		],
	})
	let resp: AxiosResponse<User>
	try {
		resp = await http.post(url, data, {
			method: 'POST',
			headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
			auth: {
				username: ADMIN_USERNAME as string,
				password: ADMIN_PASSWORD as string,
			},
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

export async function getUser(username: string) {
	const url =
		ADMIN_URL +
		'/scim2/Users/?filter=userName+Eq+' +
		encodeURIComponent(username)
	let resp: AxiosResponse<QueryUser>
	try {
		resp = await http.get(url, {
			method: 'GET',
			headers: { Accept: 'application/json' },
			auth: {
				username: ADMIN_USERNAME as string,
				password: ADMIN_PASSWORD as string,
			},
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
	console.log('RESPONSE DATA>>>>>>>>>>>>>>>', resp.data.Resources[0])
	return resp.data.Resources[0]
}

export async function deleteUser(userid: string) {
	const url = ADMIN_URL + '/scim2/Users/' + userid
	let resp: AxiosResponse<QueryUser>
	try {
		resp = await http.delete(url, {
			method: 'DELETE',
			headers: { Accept: 'application/json' },
			auth: {
				username: ADMIN_USERNAME as string,
				password: ADMIN_PASSWORD as string,
			},
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
