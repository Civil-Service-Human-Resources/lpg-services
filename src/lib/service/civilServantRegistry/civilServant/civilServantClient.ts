import {plainToInstance} from 'class-transformer'
import {User} from '../../../model'
import {Profile} from '../../../registry'
import {client} from '../config'
import {PatchCivilServant} from '../models/patchCivilServant'

const URL = 'civilServants'

export async function checkAndUpdateLineManager(user: User, lineManagerEmail: string): Promise<Profile> {
	const resp = await client._patch<null, Profile>(
		{
			params: {
				email: lineManagerEmail,
			},
			url: `${URL}/manager`,
		},
		null,
		user
	)
	return plainToInstance(Profile, resp)
}

export async function loginAndFetchProfile(accessToken: string): Promise<Profile> {
	const resp = await client.makeRawRequest<Profile>(
		{
			data: {},
			method: 'POST',
			url: `${URL}/me/login`,
		},
		accessToken
	)
	return plainToInstance(Profile, resp)
}

export async function patchCivilServant(user: User, update: PatchCivilServant) {
	await client._patch(
		{
			url: `${URL}/${user.userId}`,
		},
		update.getAsApiParams(),
		user
	)
}
