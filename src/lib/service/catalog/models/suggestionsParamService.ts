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
		department: departmentCodes.join(','),
		grade: user.grade.code,
		page: 0,
		size: DEFAULT_RECORDS_TO_SCAN_IN_ELASTIC,
	}
}

export function createParamsForOtherAreaOfWorkSection(
	otherAreaOfWork: string,
	departmentCodes: string[],
	user: User
): GetCoursesParams {
	return {
		areaOfWork: otherAreaOfWork,
		excludeAreasOfWork: getAllAreasOfWorkForUser(user).filter(aow => aow !== otherAreaOfWork).join(","),
		excludeDepartments: departmentCodes.join(','),
		grade: user.grade.code,
		page: 0,
		size: DEFAULT_RECORDS_TO_SCAN_IN_ELASTIC,
	}
}

export function createParamsForAreaOfWorkSection(
	areaOfWork: string,
	departmentCodes: string[],
	user: User
): GetCoursesParams {
	return {
		areaOfWork,
		excludeDepartments: departmentCodes.join(','),
		grade: user.grade.code,
		page: 0,
		size: DEFAULT_RECORDS_TO_SCAN_IN_ELASTIC,
	}
}

export function createParamsForInterestSection(
	interest: string,
	departmentCodes: string[],
	user: User
): GetCoursesParams {
	return {
		excludeAreasOfWork: getAllAreasOfWorkForUser(user).join(','),
		excludeDepartments: departmentCodes.join(','),
		grade: user.grade.code,
		interest,
		page: 0,
		size: DEFAULT_RECORDS_TO_SCAN_IN_ELASTIC,
	}
}
