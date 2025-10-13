import {extensionAndSize, fileName} from '../../../../lib/filehelpers'
import {Course, Module, User} from '../../../../lib/model'
import {getCourseRecord} from '../../../../lib/service/cslService/courseRecord/client'
import {CourseRecord} from '../../../../lib/service/cslService/models/courseRecord'
import {ModuleRecord} from '../../../../lib/service/cslService/models/moduleRecord'
import {BasicCoursePage, BlendedCoursePage, CourseDetails, CoursePage, SingleModuleCoursePage} from './coursePage'
import {BaseModuleCard, F2FModuleCard, FileModuleCard} from './moduleCard'
import {getLogger} from '../../../../lib/logger'

const logger = getLogger('course/models/factory')

// Modules

export function getModuleCard(course: Course, module: Module, moduleRecord?: ModuleRecord): BaseModuleCard {
	const moduleCard = getBasicModuleCard(module, course, moduleRecord)

	switch (module.type) {
		case 'face-to-face':
			return getF2FModuleCard(module, course, moduleCard, moduleRecord)
		case 'file':
			return getFileModuleCard(module, moduleCard)
		case 'elearning':
			return {
				...moduleCard,
				template: 'elearning',
			}
		default:
			return moduleCard
	}
}

export function getBasicModuleCard(module: Module, course: Course, moduleRecord?: ModuleRecord): BaseModuleCard {
	const displayState = module.getDisplayState(moduleRecord, course.getRequiredRecurringAudience()) || ''
	return {
		title: module.title,
		description: module.description,
		type: module.type,
		associatedLearning: module.associatedLearning,
		isMandatory: !module.optional,
		launchLink: `/courses/${course.id}/${module.id}`,
		duration: module.getDuration(),
		cost: module.cost,
		mustConfirmBooking: false,
		template: 'singleModule',
		displayState,
	}
}

export function getFileModuleCard(module: Module, moduleCard: BaseModuleCard): FileModuleCard {
	return {
		...moduleCard,
		fileExtAndSize: extensionAndSize(module.url!, module.fileSize!),
		fileName: fileName(module.url!),
		template: 'file',
	}
}

export function getF2FModuleCard(
	module: Module,
	course: Course,
	moduleCard: BaseModuleCard,
	moduleRecord?: ModuleRecord
): F2FModuleCard {
	let event
	if (moduleRecord && moduleRecord.eventId) {
		event = module.getEvent(moduleRecord.eventId)
	}
	const updatedCard: F2FModuleCard = {
		...moduleCard,
		canBeBooked: module.canBeBooked(),
		launchLink: `/courses/${course.id}/${module.id}/choose-date`,
		template: 'faceToFace',
	}
	if (
		!['UNREGISTERED', undefined].includes(updatedCard.displayState) &&
		event !== undefined &&
		event.status === 'Active'
	) {
		updatedCard.cancellationLink = `/book/${course.id}/${module.id}/${event.id}/cancel`
	}
	return updatedCard
}

// Course

export async function getCoursePage(user: User, course: Course): Promise<BasicCoursePage> {
	const courseRecord = await getCourseRecord(course.id, user)
	if (courseRecord) {
		course.record = courseRecord
	}
	let basicCoursePage: BasicCoursePage
	let hasFaceToFaceModule = false
	if (course.modules.length === 0) {
		basicCoursePage = getNoModuleCoursePage(course)
		hasFaceToFaceModule = false
	} else if (course.modules.length === 1) {
		const module = course.modules[0]
		basicCoursePage = getSingleModuleCoursePage(course, module, courseRecord)
		hasFaceToFaceModule = module.type === 'face-to-face'
	} else {
		basicCoursePage = getBlendedCoursePage(course, courseRecord)
		hasFaceToFaceModule = course.modules.some(m => m.type === 'face-to-face')
	}

	basicCoursePage.id = course.id
	basicCoursePage.isInLearningPlan = false
	if (course.isRequired()) {
		basicCoursePage.isInLearningPlan = undefined
	} else if (!course.record) {
		basicCoursePage.isInLearningPlan = false
	} else {
		logger.debug(`course.record.state: ${course.record.state}`)
		logger.debug(`hasFaceToFaceModule: ${hasFaceToFaceModule}`)
		if (course.record.isComplete() || course.record.state === 'ARCHIVED' || hasFaceToFaceModule) {
			basicCoursePage.isInLearningPlan = undefined
		} else {
			basicCoursePage.isInLearningPlan = true
		}
	}
	return basicCoursePage
}

export function getBlendedCoursePage(course: Course, courseRecord?: CourseRecord): BlendedCoursePage {
	let faceToFaceModule: F2FModuleCard | undefined
	const moduleRecords: Map<string, ModuleRecord> = courseRecord ? courseRecord.getModuleRecordMap() : new Map()

	const cards: BaseModuleCard[] = []
	let mandatoryCount = 0
	for (const module of course.modules) {
		const mr = moduleRecords.get(module.id)

		const card = getModuleCard(course, module, mr)

		if (card.isMandatory) {
			mandatoryCount++
		}
		if (card.type === 'face-to-face') {
			faceToFaceModule = card as F2FModuleCard
		}
		cards.push(card)
	}
	if (faceToFaceModule !== undefined && faceToFaceModule.displayState !== 'APPROVED') {
		cards.forEach(c => {
			c.mustConfirmBooking = c.associatedLearning
		})
	}
	const coursePage = getBasicCoursePage(course)
	const courseDetails = getCourseDetails(course)
	return {
		...coursePage,
		...courseDetails,
		modules: cards,
		mandatoryModuleCount: mandatoryCount,
		type: 'blended',
		template: 'blended',
	}
}

export function getSingleModuleCoursePage(
	course: Course,
	module: Module,
	courseRecord?: CourseRecord
): SingleModuleCoursePage {
	const coursePage: CoursePage = getBasicCoursePage(course)
	const moduleRecord = courseRecord ? courseRecord.getModuleRecord(module.id) : undefined
	const moduleCard = getModuleCard(course, module, moduleRecord)
	const courseDetails = getCourseDetails(course)
	if (module.type === 'face-to-face') {
		courseDetails.location = module.location
	}
	return {
		...courseDetails,
		...coursePage,
		moduleDetails: moduleCard,
		template: moduleCard.template,
		type: moduleCard.type,
	}
}

export function getBasicCoursePage(course: Course): CoursePage {
	return {
		title: course.title,
		description: course.description,
		learningOutcomes: course.learningOutcomes,
		status: course.status,
	}
}

export function getCourseDetails(course: Course): CourseDetails {
	return {
		grades: course.getGrades(),
		areasOfWork: course.getAreasOfWork(),
		duration: course.getDuration(),
		cost: course.getCost(),
	}
}

export function getNoModuleCoursePage(course: Course): BasicCoursePage {
	return {
		...getBasicCoursePage(course),
		template: 'noModules',
	}
}
