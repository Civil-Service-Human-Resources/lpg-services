import * as fileHelpers from 'lib/filehelpers'
import * as model from 'lib/model'
import { CourseRecord } from 'lib/model/learnerRecord/courseRecord'
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
	isInLearningPlan: boolean
}

export function constructModuleCta(
	courseId: string,
	module: model.Module,
	user: model.User,
	state: string,
	record?: CourseRecord,
	modifier?: string
): ModuleCallToActionProps {
	const moduleType: string = module.type
	const isRequired: boolean = !module.optional
	const isSearch: boolean = modifier === 'search'

	const isInLearningPlan = record !== undefined || isRequired === true

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
				moduleCallToActionProps.url = `/book/${courseId}/${
					module.id
				}/choose-date`
				moduleCallToActionProps.learningAction = {
					text: 'action_BOOK',
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

	return moduleCallToActionProps
}
