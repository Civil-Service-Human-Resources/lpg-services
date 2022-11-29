import {User} from '../../../model'
import {GetCoursesParams} from './GetCoursesParams'

const DEFAULT_RECORDS_TO_SCAN_IN_ELASTIC = 200

function getAllAreasOfWorkForUser(user: User): string[] {
	const areasOfWork = user.areasOfWork || []
	const otherAreasOfWork = user.otherAreasOfWork || []
	return [...areasOfWork, ...otherAreasOfWork]
}

export function createParamsForDepartmentSection(
	departmentCodes: string[],
	courseRecordIdsToExclude: string[],
	user: User
): GetCoursesParams {
	return {
		department: departmentCodes.join(','),
		excludeAreasOfWork: getAllAreasOfWorkForUser(user).join(','),
		excludeCourseIDs: courseRecordIdsToExclude.join(','),
		excludeInterests: (user.interests || []).join(','),
		grade: user.grade.code,
		page: 0,
		size: DEFAULT_RECORDS_TO_SCAN_IN_ELASTIC,
	}
}

export function createParamsForAreaOfWorkSection(
	areaOfWork: string,
	departmentCodes: string[],
	courseRecordIdsToExclude: string[],
	user: User
): GetCoursesParams {
	return {
		areaOfWork,
		excludeCourseIDs: courseRecordIdsToExclude.join(','),
		excludeDepartments: departmentCodes.join(','),
		excludeInterests: (user.interests || []).join(','),
		grade: user.grade.code,
		page: 0,
		size: DEFAULT_RECORDS_TO_SCAN_IN_ELASTIC,
	}
}

export function createParamsForInterestSection(
	interest: string,
	departmentCodes: string[],
	courseRecordIdsToExclude: string[],
	user: User
): GetCoursesParams {
	return {
		excludeAreasOfWork: getAllAreasOfWorkForUser(user).join(','),
		excludeCourseIDs: courseRecordIdsToExclude.join(','),
		excludeDepartments: departmentCodes.join(','),
		grade: user.grade.code,
		interest,
		page: 0,
		size: DEFAULT_RECORDS_TO_SCAN_IN_ELASTIC,
	}
}
