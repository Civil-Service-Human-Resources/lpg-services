import {extensionAndSize, fileName} from '../../../../lib/filehelpers'
import {Course, Module, ModuleType, User} from '../../../../lib/model'
import {getCourseRecord} from '../../../../lib/service/learnerRecordAPI/courseRecord/client'
import {CourseRecord} from '../../../../lib/service/learnerRecordAPI/courseRecord/models/courseRecord'
import {RecordState} from '../../../../lib/service/learnerRecordAPI/models/record'
import {BookingStatus, ModuleRecord} from '../../../../lib/service/learnerRecordAPI/moduleRecord/models/moduleRecord'
import {BasicCoursePage, BlendedCoursePage, CourseDetails, CoursePage, SingleModuleCoursePage} from './coursePage'
import {BaseModuleCard, F2FModuleCard, FileModuleCard} from './moduleCard'

// Modules

export function getModuleCard(course: Course, module: Module, moduleRecord?: ModuleRecord): BaseModuleCard {
	switch (module.type) {
		case ModuleType.FACE_TO_FACE:
			return getF2FModuleCard(module, course, moduleRecord)
		case ModuleType.FILE:
			return getFileModuleCard(module, course)
		case ModuleType.ELEARNING:
			return getElearningModuleCard(module, course)
		default:
			return getBasicModuleCard(module, course)
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
		displayState,
		template: 'singleModule',
	}
}

export function getElearningModuleCard(module: Module, course: Course): BaseModuleCard {
	const moduleCard: BaseModuleCard = getBasicModuleCard(module, course)
	return {
		...moduleCard,
		template: 'elearning',
	}
}

export function getFileModuleCard(module: Module, course: Course): FileModuleCard {
	const moduleCard: BaseModuleCard = getBasicModuleCard(module, course)
	return {
		...moduleCard,
		fileExtAndSize: extensionAndSize(module.url!, module.fileSize!),
		fileName: fileName(module.url!),
		template: 'file',
	}
}

export function getF2FModuleCard(module: Module, course: Course, moduleRecord?: ModuleRecord): F2FModuleCard {
	const moduleCard: BaseModuleCard = getBasicModuleCard(module, course)
	let eventId
	let moduleRecordState: RecordState | BookingStatus = RecordState.Null
	if (moduleRecord) {
		moduleRecordState = moduleRecord.state || RecordState.Null
		eventId = moduleRecord.eventId
	}
	const updatedCard: F2FModuleCard = {
		...moduleCard,
		canBeBooked: module.canBeBooked(),
		launchLink: `/courses/${course.id}/${module.id}/choose-date`,
		template: 'faceToFace',
	}
	if (moduleRecordState === BookingStatus.CONFIRMED && eventId !== undefined) {
		updatedCard.cancellationLink = `/book/${course.id}/${module.id}/${eventId}/cancel`
	}
	return updatedCard
}

// Course

export async function getCoursePage(user: User, course: Course): Promise<BasicCoursePage> {
	if (course.modules.length === 0) {
		return getNoModuleCoursePage(course)
	} else {
		const courseRecord = await getCourseRecord(course.id, user)
		if (course.modules.length === 1) {
			const module = course.modules[0]
			return getSingleModuleCoursePage(course, module, courseRecord)
		} else {
			return getBlendedCoursePage(course, courseRecord)
		}
	}
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
		if (card.type === ModuleType.FACE_TO_FACE) {
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
	if (module.type === ModuleType.FACE_TO_FACE) {
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
