import {plainToInstance} from 'class-transformer'
import * as fileHelpers from 'lib/filehelpers'
import {CourseRecord} from 'lib/learnerrecord'
import {Module} from 'lib/model'
import * as model from 'lib/model'
import {ActionToPlan, CourseActionType} from 'lib/ui/courseCallToAction'

export interface LearningAction {
	text: string
	fileHelper?: string
	attribute?: string
}

export interface ModuleCallToActionProps {
	actionToPlan?: ActionToPlan
	learningAction: LearningAction
	message?: string
	url?: string
	moduleType?: string
	modifier?: string
	isInLearningPlan: boolean,
	isActionable?: boolean
}

export function constructModuleCta(
	courseId: string,
	module: model.Module,
	user: model.User,
	state: string,
	record?: CourseRecord,
	modifier?: string
): ModuleCallToActionProps {
	module = plainToInstance(Module, module)
	const moduleType: string = module.type
	const isRequired: boolean = !module.optional
	const isSearch: boolean = modifier === 'search'

	const isInLearningPlan = record !== undefined || isRequired === true
	let isActionable = true

	const moduleCallToActionProps: ModuleCallToActionProps = {
		isInLearningPlan,
		learningAction: {
			text: `action_${state || 'NOT_STARTED'}`,
		},
		url: `/courses/${courseId}/${module.id}${isSearch ? '#modules' : ''}`,
	}

	if (!isSearch) {
		switch (moduleType) {
			case 'face-to-face':
				if (module.canBeBooked()) {
					moduleCallToActionProps.url = `/book/${courseId}/${
						module.id
					}/choose-date`
					moduleCallToActionProps.learningAction = {
						text: 'action_BOOK',
					}
				} else {
					moduleCallToActionProps.message = "components.notification_banner.course_not_bookable"
					isActionable = false
				}
				break

			case 'file':
				moduleCallToActionProps.learningAction = {
					attribute: `download`,
					text: 'action_DOWNLOAD',
				}
				if (module.url) {
					moduleCallToActionProps.learningAction.fileHelper = `${fileHelpers.extension(
						module.url!
					)} ${fileHelpers.appropriateFileSize(module.fileSize!)}`
				}
				break
			case 'blog':
				moduleCallToActionProps.learningAction.attribute = `target=_blank`
				break
		}
	} else {
		if (!isInLearningPlan) {
			moduleCallToActionProps.actionToPlan = {
				type: CourseActionType.Add,
				url: `/suggestions-for-you/add/${courseId}?ref=${modifier}`,
			}
		} else {
			moduleCallToActionProps.message = 'Already in your learning plan'
		}
	}
	moduleCallToActionProps.isActionable = isActionable
	return moduleCallToActionProps
}
