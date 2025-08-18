import {User} from '../../model'
import {getOrganisationsDropdown} from './cslServiceClient'
import {GetOrganisationsFormattedParams} from './models/csrs/getOrganisationsFormattedParams'

export async function getOrganisationTypeaheadForUser(user: User) {
	let params = new GetOrganisationsFormattedParams()
	if (!user.isUnrestrictedOrgUser()) {
		params = new GetOrganisationsFormattedParams(user.getDomain(), user.getOtherOrganisationIds())
	}
	return await getOrganisationsDropdown(user, params)
}
