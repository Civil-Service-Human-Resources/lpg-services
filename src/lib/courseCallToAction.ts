import * as model from 'lib/model'

export enum CourseActionType {
	Add = 'Add',
	Delete = 'Delete',
}
export interface CallToActionProps {
	accessibilityHelper: string
	actionToPlan?: {
		type: CourseActionType
		url: string
	}
	actionToRecord?: {
		move: string
		skip: string
	}
	isInLearningPlan: boolean
	message: string
	url: string
}

export function constructCourseCallToAction(
	course: model.Course,
	user: model.User,
	modifier?: string
) {
	const courseType = course.getType()
	const isRequired: boolean = course.isRequired(user)
	const isHome: boolean = modifier === 'home'

	const callToActionProps: CallToActionProps = {
		accessibilityHelper: ' this course',
		isInLearningPlan: false,
		message: courseType === 'face-to-face' ? 'Book' : 'action_NOT_STARTED',
		url:
			courseType === 'face-to-face'
				? `/book/${course.id}/${course.modules[0].id}/choose-date`
				: `/courses/${course.id}#modules`,
	}

	if (isRequired) {
		callToActionProps.isInLearningPlan = true
	}

	if (courseType === 'face-to-face') {
		callToActionProps.url = `/book/${course.id}/${
			course.modules[0].id
		}/choose-date`
		callToActionProps.message = 'Book'
	}

	if (course.record) {
		const record = course.record
		callToActionProps.isInLearningPlan = true
		switch (courseType) {
			case 'face-to-face':
				const isBooked =
					record.modules && record.modules.length && record.modules[0].eventId

				const isDatePassed = new Date() > course.getSelectedDate()!

				if (isBooked) {
					if (isDatePassed) {
						callToActionProps.actionToRecord = {
							move: `/home?move=${course.id},${
								course.record.modules[0].moduleId
							},${course.record.modules[0].eventId}`,
							skip: `/home?skip=${course.id},${
								course.record.modules[0].moduleId
							},${course.record.modules[0].eventId}`,
						}
						delete callToActionProps.url
						delete callToActionProps.message
					} else {
						callToActionProps.url = `/book/${course.id}/${
							record.modules[0].moduleId
						}/${record.modules[0].eventId}/cancel`
						callToActionProps.message = `cancel`
					}
				}
				break
			default:
				break
		}
		if (!isRequired && record.state !== 'REGISTERED' && isHome) {
			callToActionProps.actionToPlan = {
				type: CourseActionType.Delete,
				url: `/home?delete=${course.id}`,
			}
		}
	} else {
		if (!isRequired && modifier === 'search') {
			callToActionProps.actionToPlan = {
				type: CourseActionType.Add,
				url: `/suggestions-for-you/add/${course.id}?ref=${modifier}`,
			}
		}
	}
	return callToActionProps
}
