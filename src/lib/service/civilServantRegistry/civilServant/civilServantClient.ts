import {plainToInstance} from 'class-transformer'
import {User} from 'lib/model'
import {Profile} from 'lib/registry'
import {PatchCivilServant} from 'lib/service/civilServantRegistry/models/patchCivilServant'
import {client} from '../config'

const URL = 'civilServants'

export async function patchCivilServantOrganisation(user: User, organisationalUnitId: number) {
	await client._patch({
		url: `${URL}/me/organisationalUnit`,
	}, {
		organisationalUnitId,
	}, user)
}

export async function checkAndUpdateLineManager(user: User, lineManagerEmail: string): Promise<Profile> {
	const resp = await client._patch<null, Profile>({
		params: {
			email: lineManagerEmail,
		},
		url: `${URL}/manager`,
	}, null, user)
	return plainToInstance(Profile, resp)
}

export async function loginAndFetchProfile(accessToken: string): Promise<Profile> {
	const resp = await client.makeRawRequest<Profile>({
		data: {},
		method: 'POST',
		url: `${URL}/me/login`,
	}, accessToken)
	return plainToInstance(Profile, resp)
}

export async function patchCivilServant(user: User, update: PatchCivilServant) {
	await client._patch({
		url: `${URL}/${user.userId}`,
	}, update.getAsApiParams(), user)
}
