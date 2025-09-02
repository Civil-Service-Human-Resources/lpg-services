import {plainToInstance} from 'class-transformer'
import {client} from './baseConfig'
import {User} from '../../model'
import {LearningPlanCache} from './cache/LearningPlanCache'
import {LearningRecordCache} from './cache/learningRecordCache'
import {RequiredLearningCache} from './cache/RequiredLearningCache'
import {BookEventDto} from './models/BookEventDto'
import {CancelBookingDto} from './models/CancelBookingDto'
import {CourseActionResponse} from './models/CourseActionResponse'
import {FormattedOrganisationList} from './models/csrs/formattedOrganisationList'
import {FormattedOrganisationListCache} from './models/csrs/formattedOrganisationListCache'
import {FormattedOrganisations} from './models/csrs/formattedOrganisations'
import {GetOrganisationsFormattedParams} from './models/csrs/getOrganisationsFormattedParams'
import {EventActionResponse} from './models/EventActionResponse'
import {createUserDto} from './models/factory/UserDtoFactory'
import {LaunchModuleResponse} from './models/launchModuleResponse'
import {AreasOfWork} from './models/areasOfWork'
import {LearningPlan} from './models/learning/learningPlan/learningPlan'
import {LearningRecord} from './models/learning/learningRecord/learningRecord'
import {RequiredLearning} from './models/learning/requiredLearning/requiredLearning'
import {UserDto} from './models/UserDto'
import {Grades} from './models/grades'

export let learningRecordCache: LearningRecordCache
export let requiredLearningCache: RequiredLearningCache
export let learningPlanCache: LearningPlanCache
export let formattedOrganisationListCache: FormattedOrganisationListCache

export const setCaches = (
	learningRecordPageCache: LearningRecordCache,
	requiredLearningPageCache: RequiredLearningCache,
	LearningPlanPageCache: LearningPlanCache,
	formattedOrgListCache: FormattedOrganisationListCache
) => {
	learningRecordCache = learningRecordPageCache
	requiredLearningCache = requiredLearningPageCache
	learningPlanCache = LearningPlanPageCache
	formattedOrganisationListCache = formattedOrgListCache
}

export async function clearLearningCachesForCourse(userId: string, courseId: string) {
	await Promise.all([
		learningPlanCache.clearForCourse(userId, courseId),
		requiredLearningCache.clearForCourse(userId, courseId),
		learningRecordCache.delete(userId),
	])
}

export async function launchModule(courseId: string, moduleId: string, user: User): Promise<LaunchModuleResponse> {
	const body: UserDto = await createUserDto(user)
	const resp = await client._post<UserDto, LaunchModuleResponse>(
		{
			url: `/courses/${courseId}/modules/${moduleId}/launch`,
		},
		body,
		user
	)
	await requiredLearningCache.clearForCourse(user.id, courseId)
	await learningPlanCache.delete(user.id)
	await learningRecordCache.delete(user.id)
	return plainToInstance(LaunchModuleResponse, resp)
}

export async function completeModule(courseId: string, moduleId: string, user: User): Promise<void> {
	const body: UserDto = await createUserDto(user)
	await client._post<UserDto, LaunchModuleResponse>(
		{
			url: `/courses/${courseId}/modules/${moduleId}/complete`,
		},
		body,
		user
	)
	await requiredLearningCache.clearForCourse(user.id, courseId)
	await learningPlanCache.delete(user.id)
	await learningRecordCache.delete(user.id)
}

export async function removeCourseFromLearningPlan(courseId: string, user: User): Promise<CourseActionResponse> {
	const resp = await client._post(
		{
			url: `/courses/${courseId}/remove_from_learning_plan`,
		},
		undefined,
		user
	)
	await learningPlanCache.removeCourse(user.id, courseId)
	return plainToInstance(CourseActionResponse, resp)
}

export async function addCourseToLearningPlan(courseId: string, user: User): Promise<CourseActionResponse> {
	const resp = await client._post(
		{
			url: `/courses/${courseId}/add_to_learning_plan`,
		},
		undefined,
		user
	)
	await learningPlanCache.delete(user.id)
	return plainToInstance(CourseActionResponse, resp)
}

export async function removeCourseFromSuggestions(courseId: string, user: User): Promise<CourseActionResponse> {
	const resp = await client._post(
		{
			url: `/courses/${courseId}/remove_from_suggestions`,
		},
		undefined,
		user
	)
	return plainToInstance(CourseActionResponse, resp)
}

export async function bookEvent(
	courseId: string,
	moduleId: string,
	eventId: string,
	user: User,
	bookEventDto: BookEventDto
): Promise<EventActionResponse> {
	const resp = await client._post(
		{
			url: `/courses/${courseId}/modules/${moduleId}/events/${eventId}/create_booking`,
		},
		bookEventDto,
		user
	)
	await learningPlanCache.delete(user.id)
	return plainToInstance(EventActionResponse, resp)
}

export async function cancelEventBooking(
	courseId: string,
	moduleId: string,
	eventId: string,
	user: User,
	dto: CancelBookingDto
): Promise<EventActionResponse> {
	const resp = await client._post(
		{
			url: `/courses/${courseId}/modules/${moduleId}/events/${eventId}/cancel_booking`,
		},
		dto,
		user
	)
	await learningPlanCache.delete(user.id)
	return plainToInstance(EventActionResponse, resp)
}

export async function completeEventBooking(
	courseId: string,
	moduleId: string,
	eventId: string,
	user: User
): Promise<EventActionResponse> {
	const userDto = await createUserDto(user)
	const resp = await client._post<UserDto, EventActionResponse>(
		{
			url: `/courses/${courseId}/modules/${moduleId}/events/${eventId}/complete_booking`,
		},
		userDto,
		user
	)
	await learningRecordCache.delete(user.id)
	await learningPlanCache.delete(user.id)
	return plainToInstance(EventActionResponse, resp)
}

export async function skipEventBooking(
	courseId: string,
	moduleId: string,
	eventId: string,
	user: User
): Promise<EventActionResponse> {
	const resp = await client._post(
		{
			url: `/courses/${courseId}/modules/${moduleId}/events/${eventId}/skip_booking`,
		},
		null,
		user
	)
	await learningPlanCache.delete(user.id)
	return plainToInstance(EventActionResponse, resp)
}

export async function getLearningRecord(user: User): Promise<LearningRecord> {
	let learningRecord = await learningRecordCache.get(user.id)
	if (learningRecord === undefined) {
		const resp = await client._get(
			{
				url: `/learning/record`,
			},
			user
		)
		learningRecord = plainToInstance(LearningRecord, resp)
		await learningRecordCache.setObject(learningRecord)
	}
	return learningRecord
}

export async function getRequiredLearning(user: User): Promise<RequiredLearning> {
	let requiredLearning = await requiredLearningCache.get(user.id)
	if (requiredLearning === undefined) {
		const resp = await client._get(
			{
				url: `/learning/required`,
			},
			user
		)
		requiredLearning = plainToInstance(RequiredLearning, resp)
		await requiredLearningCache.setObject(requiredLearning)
	}
	return requiredLearning
}

export async function getLearningPlan(user: User): Promise<LearningPlan> {
	let learningPlan = await learningPlanCache.get(user.id)
	if (learningPlan === undefined) {
		const resp = await client._get(
			{
				url: `/learning/plan`,
			},
			user
		)
		learningPlan = plainToInstance(LearningPlan, resp)
		await learningPlanCache.setObject(learningPlan)
	}
	return learningPlan
}

export async function getAreasOfWork(user: User) {
	const resp: AreasOfWork = await client._get(
		{
			url: `areas-of-work`,
		},
		user
	)
	return plainToInstance(AreasOfWork, resp).areasOfWork
}

export async function setOrganisationUnit(user: User, organisationUnitId: number) {
	await client._post(
		{
			url: `/user/profile/organisationUnit`,
			headers: {
				'Content-Type': 'application/json',
			},
		},
		JSON.stringify({organisationUnitId}),
		user
	)
}

export async function setOtherAreasOfWork(user: User, areaOfWorkIds: string[]) {
	await client._post(
		{
			url: `/user/profile/other-areas-of-work`,
		},
		areaOfWorkIds.map(aow => parseInt(aow)),
		user
	)
}

export async function getGrades(user: User) {
	const resp: Grades = await client._get(
		{
			url: 'grades',
		},
		user
	)
	return plainToInstance(Grades, resp).grades
}

export async function setGrade(user: User, gradeId: string) {
	await client._post(
		{
			url: `/user/profile/grade`,
			headers: {
				'Content-Type': 'application/json',
			},
		},
		JSON.stringify({gradeId}),
		user
	)
}

export async function setProfession(user: User, professionId: string) {
	await client._post(
		{
			url: `/user/profile/profession`,
			headers: {
				'Content-Type': 'application/json',
			},
		},
		JSON.stringify({professionId}),
		user
	)
}

export async function setFullName(user: User, fullName: string, newProfile: boolean) {
	await client._post(
		{
			url: `/user/profile/full-name`,
			params: {newProfile},
			headers: {
				'Content-Type': 'application/json',
			},
		},
		JSON.stringify({fullName}),
		user
	)
}

export async function getOrganisationsDropdown(user: User, params: GetOrganisationsFormattedParams) {
	const cacheKey = params.getCacheKey()
	let typeahead = await formattedOrganisationListCache.get(cacheKey)
	if (typeahead === undefined) {
		const resp: FormattedOrganisations = await client._get(
			{
				url: '/organisations/formatted_list',
				params,
			},
			user
		)
		const formattedOrganisations = plainToInstance(FormattedOrganisations, resp)
		typeahead = new FormattedOrganisationList(cacheKey, formattedOrganisations.formattedOrganisationalUnitNames)
		await formattedOrganisationListCache.set(cacheKey, typeahead)
	}
	return typeahead.formattedOrganisations
}
