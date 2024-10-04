import {User} from 'lib/model'
import {getOrgHierarchy} from 'lib/service/civilServantRegistry/csrsService'
import {UserDto} from 'lib/service/cslService/models/UserDto'

export async function createUserDto(user: User): Promise<UserDto> {
	const orgHierarchy = (await getOrgHierarchy(user.organisationalUnit!.id, user))
		.map(o => {
			return {id: o.id, code: o.code, name: o.name}
		})
	return new UserDto(user.userName,
				user.givenName!,
				user.areasOfWork!.id,
				user.areasOfWork!.name,
				orgHierarchy,
				user.grade !== undefined ? user.grade.id : undefined,
				user.grade !== undefined ? user.grade.name : undefined)
}
