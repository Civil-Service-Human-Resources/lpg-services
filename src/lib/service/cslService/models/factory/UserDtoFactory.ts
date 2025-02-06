import {User} from '../../../../model'
import {getOrgHierarchy} from '../../../civilServantRegistry/csrsService'
import {UserDto} from '../UserDto'

export async function createUserDto(user: User): Promise<UserDto> {
	const orgHierarchy = (await getOrgHierarchy(user.organisationalUnit!.id, user)).map(o => {
		return {id: o.id, code: o.code, name: o.name}
	})
	const userGrade = user.grade
	const userLineManager = user.lineManager
	return new UserDto(
		user.userName,
		user.givenName!,
		user.areaOfWork!.id,
		user.areaOfWork!.name,
		orgHierarchy,
		userGrade !== undefined ? userGrade.id : undefined,
		userGrade !== undefined ? userGrade.name : undefined,
		userLineManager !== undefined ? userLineManager.name : undefined,
		userLineManager !== undefined ? userLineManager.email : undefined
	)
}
