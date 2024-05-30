import {User} from 'lib/model'
import {getOrgHierarchy} from 'lib/service/civilServantRegistry/csrsService'
import {UserDto} from 'lib/service/cslService/models/UserDto'

export async function createUserDto(user: User): Promise<UserDto> {
	const orgHierarchy = (await getOrgHierarchy(user.organisationalUnit!.id, user))
		.map(o => o.code)
	return {
		gradeId: user.grade !== undefined ? user.grade.id : undefined,
		learnerEmail: user.userName,
		learnerName: user.givenName!,
		organisationId: user.organisationalUnit!.id,
		professionId: user.areasOfWork!.id,
		userDepartmentHierarchy: orgHierarchy,
	}
}
