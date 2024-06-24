import {User} from 'lib/model'
import {getOrgHierarchy} from 'lib/service/civilServantRegistry/csrsService'
import {UserDto} from 'lib/service/cslService/models/UserDto'

export async function createUserDto(user: User): Promise<UserDto> {
	const orgHierarchy = (await getOrgHierarchy(user.organisationalUnit!.id, user))
		.map(o => o.code)
	return new UserDto(user.userName, 
				user.givenName!, 
				user.organisationalUnit!.id, 
				user.organisationalUnit!.abbreviation,
				user.areasOfWork!.id,
				user.areasOfWork!.name,
				orgHierarchy, 
				user.grade !== undefined ? user.grade.id : undefined,
				user.grade !== undefined ? user.grade.code : undefined)
}
