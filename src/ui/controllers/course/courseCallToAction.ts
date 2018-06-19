/*
import * as express from 'express'
import * as model from 'lib/model'

export interface CallToActionProps {
	accessibilityHelper: string
	actionToLearningPlan: string
	message: string
	noAction: string
	url: string
}

function constructCourseCallToAction(
	course: model.Course,
	req: express.Request,
	modifier?: string
) {
	const user = req.user
	const courseType = course.getType()
	const isRequired: boolean = course.isRequired(user)

	const callToActionProps: CallToActionProps = {
		accessibilityHelper: ' this course',
		actionToLearningPlan: `/suggestions-for-you/add/${
			course.id
		}?ref=${modifier}`,
		message: req.__('action_NOT_STARTED'),
		noAction: 'Already in your learning plan',
		url: `/courses/${course.id}#modules`,
	}

	/!*let url: string = `/courses/${course.id}#modules`
	let message: string = req.__('action_NOT_STARTED')
	let accessibilityHelper: string = ' this course'
	let noAction: string = 'Already in your learning plan'
	let actionToLearningPlan = `/suggestions-for-you/add/${
		course.id
	}?ref=${modifier}`
*!/
	if (course.record) {
		const record = course.record
		const hasState = course.record.state && course.record.state !== 'ARCHIVED'

		switch (courseType) {
			case 'link':
				break
			case 'file':
				break
			case 'face-to-face':
				const isBooked =
					record.modules && record.modules.length && record.modules[0].eventId

				if (isBooked) {
					callToActionProps.url = `/book/${course.id}/${
						record.modules[0].moduleId
					}/${record.modules[0].eventId}/cancel`
					callToActionProps.message = `cancel`
				} else {
					callToActionProps.url = `/book/${course.id}/${
						course.modules[0].id
					}/choose-date`
					callToActionProps.message = `book`
				}

				break
			default:
				break
		}
		if (!isRequired && hasState) {
			callToActionProps.actionToLearningPlan = `/home?delete=${course.id}`
		}
	} else {
		if (courseType === 'face-to-face') {
			callToActionProps.url = `/book/${course.id}/${
				course.modules[0].id
			}/choose-date`
		}
	}
	return callToActionProps
}

// function isBooked(course: model.Course, user: model.User) {
// 	return (
// 		course.record!.modules &&
// 		course.record!.modules.length &&
// 		course.record!.modules[0].eventId
// 	)
// }

// export enum CallToActionType {
// 	FaceToFace,
// 	Booked,
// 	AddedToLearningPlan,
// 	NotRequired,
// }

// export function courseState(): CallToActionType[] {
//
//
//
// }
*/
