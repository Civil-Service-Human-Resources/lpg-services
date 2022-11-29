import {User} from '../../../model'
import {GetCoursesParams} from './GetCoursesParams'

const DEFAULT_RECORDS_TO_SCAN_IN_ELASTIC = 200

function getAreasOfWorkForUser(user: User) {
	return (user.areasOfWork || [])
}

function getOtherAreasOfWorkForUser(user: User) {
	return (user.otherAreasOfWork || []).map(aow => aow.name)
}

function getAllAreasOfWorkForUser(user: User): string[] {
	const areasOfWork = getAreasOfWorkForUser(user)
	const otherAreasOfWork = getOtherAreasOfWorkForUser(user)
	return [...areasOfWork, ...otherAreasOfWork]
}

export function createParamsForDepartmentSection(
	departmentCodes: string[],
	user: User
): GetCoursesParams {
	return {
		departments: departmentCodes.join(','),
		grade: user.grade.code,
		page: 0,
		size: DEFAULT_RECORDS_TO_SCAN_IN_ELASTIC,
	}
}

export function createParamsForOtherAreaOfWorkSection(
	departmentCodes: string[],
	user: User
): GetCoursesParams[] {
	return (user.otherAreasOfWork || [])
	.map(aow => aow.name)
	.filter(aow => !(user.areasOfWork || []).includes(aow))
	.filter(aow => aow !== "I don't know")
	.map(aow => {
		return {
			areaOfWork: aow,
			excludeAreasOfWork: getAllAreasOfWorkForUser(user).filter(aAow => aow !== aAow).join(","),
			excludeDepartments: departmentCodes.join(','),
			grade: user.grade.code,
			page: 0,
			size: DEFAULT_RECORDS_TO_SCAN_IN_ELASTIC,
		}
	})
}

export function createParamsForAreaOfWorkSection(
	departmentCodes: string[],
	user: User
): GetCoursesParams[] {
	return (user.areasOfWork || [])
	.filter(aow => aow !== "I don't know")
	.map(aow => {
		return {
			areaOfWork: aow,
			excludeDepartments: departmentCodes.join(','),
			grade: user.grade.code,
			page: 0,
			size: DEFAULT_RECORDS_TO_SCAN_IN_ELASTIC,
		}
	})
}

export function createParamsForInterestSection(
	departmentCodes: string[],
	user: User
): GetCoursesParams[] {
	return (user.interests || [])
	.map(interest => {
		return {
			excludeAreasOfWork: getAllAreasOfWorkForUser(user).join(','),
			excludeDepartments: departmentCodes.join(','),
			grade: user.grade.code,
			interest,
			page: 0,
			size: DEFAULT_RECORDS_TO_SCAN_IN_ELASTIC,
		}
	})
}
