import axios, {AxiosResponse} from 'axios'
import {plainToInstance, Type} from 'class-transformer'
import * as https from 'https'
import * as config from 'lib/config'
import {IdentityDetails} from 'lib/identity'
import {LineManager, OrganisationalUnit} from 'lib/model'
import * as traverson from 'traverson'
import * as hal from 'traverson-hal'

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

export async function patch(node: string, data: any, token: string) {
	const result = await new Promise((resolve, reject) =>
		traverson
			.from(config.REGISTRY_SERVICE_URL + node)
			.json()
			.withRequestOptions({
				auth: {
					bearer: token,
				},
			})
			.patch(data, (error, response) => {
				if (error) {
					reject(error)
				} else {
					if (response.statusCode >= 200 && response.statusCode < 300) {
						resolve(response)
					} else {
						reject(error.response)
					}
				}
			})
	)

	return result
}

export class Grade {
	constructor(public code: string, public name: string) { }

}

export class AreaOfWork {
	constructor(public id: number, public name: string) { }
}

export class Interest {
	constructor(public name: string) { }
}

export class Identity {
	constructor(public uid: string) { }
}

export class Profile {
	fullName?: string
	@Type(() => Grade)
	grade?: Grade
	@Type(() => OrganisationalUnit)
	organisationalUnit?: OrganisationalUnit
	@Type(() => AreaOfWork)
	profession?: AreaOfWork
	@Type(() => AreaOfWork)
	otherAreasOfWork?: AreaOfWork[]
	@Type(() => Interest)
	interests?: Interest[]
	lineManagerName?: string
	lineManagerEmailAddress?: string
	userId: number
	@Type(() => Identity)
	identity: Identity

	getLineManager(): LineManager | undefined {
		if (this.lineManagerEmailAddress && this.lineManagerName) {
			return {
				email: this.lineManagerEmailAddress,
				name: this.lineManagerName,
			}
		}
	}
}

export async function login(token: string, identityDetails: IdentityDetails) {
	const resp = await http.post<Profile>(
		config.REGISTRY_SERVICE_URL + '/civilServants/me/login',
		identityDetails, {
		headers: { Authorization: `Bearer ${token}` },
	})
	return plainToInstance(Profile, resp.data)
}

export async function profile(token: string): Promise<Profile> {
	const resp = await http.get<Profile>(
		config.REGISTRY_SERVICE_URL + '/civilServants/me',
		{
			headers: { Authorization: `Bearer ${token}` },
		})
	if (resp.data === undefined) {
		throw new Error("Profile data was undefined")
	}
	return plainToInstance(Profile, resp.data)
}

export async function getWithoutHal(path: string): Promise<AxiosResponse> {
	try {
		return await http.get(config.REGISTRY_SERVICE_URL + path)
	} catch (error) {
		throw new Error(error)
	}
}

export async function getAllProfessions(): Promise<any[]> {
	const path: string = "/professions"
	const response = await getWithoutHal(path)
	return response.data._embedded.professions
}

export async function getAllInterests(): Promise<any[]> {
	const path: string = "/interests"
	const response = await getWithoutHal(path)
	return response.data._embedded.interests
}
