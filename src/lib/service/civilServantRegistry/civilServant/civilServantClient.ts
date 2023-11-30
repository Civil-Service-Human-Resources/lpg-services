import {User} from 'lib/model'
import {client} from '../config'

const URL = '/civilServants'

export async function patchCivilServantOrganisation(user: User, organisationalUnitId: number) {
	await client._patch({
		url: `${URL}/me/organisationalUnit`,
	}, {
		organisationalUnitId,
	}, user)
}
