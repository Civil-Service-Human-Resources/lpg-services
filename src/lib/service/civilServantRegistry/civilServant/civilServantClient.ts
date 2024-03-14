import {IdentityDetails} from 'lib/identity'
import {User} from 'lib/model'
import {client} from '../config'

const URL = 'civilServants'

export async function patchCivilServantOrganisation(user: User, organisationalUnitId: number) {
	await client._patch({
		url: `${URL}/me/organisationalUnit`,
	}, {
		organisationalUnitId,
	}, user)
}

export async function performLoginCheck(user: User, identityDto: IdentityDetails) {
	await client._post({
		url: `${URL}/me/login`,
	}, identityDto, user)
}
