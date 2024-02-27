import {plainToInstance} from 'class-transformer'
import * as config from 'lib/config'
import {Course, Module, User} from 'lib/model'
import {BookEventDto} from 'lib/service/cslService/models/BookEventDto'
import {CancelBookingDto} from 'lib/service/cslService/models/CancelBookingDto'
import {CourseActionResponse} from 'lib/service/cslService/models/CourseActionResponse'
import {EventActionResponse} from 'lib/service/cslService/models/EventActionResponse'
import {createUserDto} from 'lib/service/cslService/models/factory/UserDtoFactory'
import {UserDto} from 'lib/service/cslService/models/UserDto'
import {HttpClient} from '../httpClient'
import {LaunchModuleResponse} from './models/launchModuleResponse'

const client = HttpClient.createFromParams(config.CSL_SERVICE.url, config.REQUEST_TIMEOUT)

export async function launchModule(
	course: Course,
	module: Module,
	user: User
): Promise<LaunchModuleResponse> {
	const body: UserDto = await createUserDto(user)
	const resp = await client._post<UserDto, LaunchModuleResponse>(
		{
			url: `/courses/${course.id}/modules/${module.id}/launch`,
		},
		body,
		user
	)
	return plainToInstance(LaunchModuleResponse, resp)
}

export async function completeModule(courseId: string, moduleId: string, user: User): Promise<void> {
	const body: UserDto = await createUserDto(user)
	await client._post<UserDto, LaunchModuleResponse>({
			url: `/courses/${courseId}/modules/${moduleId}/complete`,
		},
		body,
		user)
}

export async function removeCourseFromLearningPlan(courseId: string, user: User): Promise<CourseActionResponse> {
	const resp = await client._post({
			url: `/courses/${courseId}/remove_from_learning_plan`,
		},
		undefined,
		user)
	return plainToInstance(CourseActionResponse, resp)
}

export async function addCourseToLearningPlan(courseId: string, user: User): Promise<CourseActionResponse> {
	const resp = await client._post({
			url: `/courses/${courseId}/add_to_learning_plan`,
		},
		undefined,
		user)
	return plainToInstance(CourseActionResponse, resp)
}

export async function removeCourseFromSuggestions(courseId: string, user: User): Promise<CourseActionResponse> {
	const resp = await client._post({
			url: `/courses/${courseId}/remove_from_suggestions`,
		},
		undefined,
		user)
	return plainToInstance(CourseActionResponse, resp)
}

export async function bookEvent(
	courseId: string, moduleId: string, eventId: string,
	user: User, bookEventDto: BookEventDto): Promise<EventActionResponse> {
	const resp = await client._post({
			url: `/courses/${courseId}/modules/${moduleId}/events/${eventId}/create_booking`,
		},
		bookEventDto,
		user)
	return plainToInstance(EventActionResponse, resp)
}

export async function cancelEventBooking(
	courseId: string, moduleId: string, eventId: string,
	user: User, dto: CancelBookingDto): Promise<EventActionResponse> {
	const resp = await client._post({
			url: `/courses/${courseId}/modules/${moduleId}/events/${eventId}/cancel_booking`,
		},
		dto,
		user)
	return plainToInstance(EventActionResponse, resp)
}

export async function completeEventBooking(
	courseId: string, moduleId: string, eventId: string, user: User): Promise<EventActionResponse> {
	const userDto = await createUserDto(user)
	const resp = await client._post<UserDto, EventActionResponse>({
			url: `/courses/${courseId}/modules/${moduleId}/events/${eventId}/complete_booking`,
		},
		userDto,
		user)
	return plainToInstance(EventActionResponse, resp)
}

export async function skipEventBooking(
	courseId: string, moduleId: string, eventId: string, user: User): Promise<EventActionResponse> {
	const resp = await client._post({
			url: `/courses/${courseId}/modules/${moduleId}/events/${eventId}/skip_booking`,
		},
		null,
		user)
	return plainToInstance(EventActionResponse, resp)
}
