import {expect} from 'chai'
import * as sinon from 'sinon'
import * as fileHelpers from '../../../../lib/filehelpers'
import {Course, CourseStatus, Module, ModuleType, User} from '../../../../lib/model'
import {CourseRecord} from '../../../../lib/service/learnerRecordAPI/courseRecord/models/courseRecord'
import {RecordState} from '../../../../lib/service/learnerRecordAPI/models/record'
import {ModuleRecord} from '../../../../lib/service/learnerRecordAPI/moduleRecord/models/moduleRecord'
import {BlendedCoursePage, SingleModuleCoursePage} from './coursePage'
import {
	getBasicModuleCard,
	getBlendedCoursePage,
	getCoursePage,
	getF2FModuleCard,
	getFileModuleCard,
	getSingleModuleCoursePage,
} from './factory'
import {F2FModuleCard, FileModuleCard} from './moduleCard'

describe('Course page model tests', () => {
	const sandbox = sinon.createSandbox()
	let fileHelperStub: sinon.SinonStubbedInstance<typeof fileHelpers>

	const user = new User('user-id', ['LEARNER'], 'access-token', 'user@email.com', 'user-id')

	const module = new Module('module-id', ModuleType.FILE)
	module.title = 'Module title'
	module.description = 'Module description'
	module.associatedLearning = true
	module.optional = false
	module.duration = 100
	module.cost = 1
	const course = new Course('course-id')
	course.modules = []
	course.title = 'Course title'
	course.description = 'Course description'
	course.learningOutcomes = 'Course learning outcomes'
	course.status = CourseStatus.PUBLISHED

	beforeEach(() => {
		fileHelperStub = sandbox.stub(fileHelpers)
		fileHelperStub.extensionAndSize.returns('pdf, 10KB')
		fileHelperStub.fileName.returns('filename')
	})

	afterEach(() => {
		sandbox.restore()
	})

	describe('Module card page model tests', () => {
		it('Should build a basic module card', () => {
			const result = getBasicModuleCard(module, course)
			expect(result.title).eql('Module title')
			expect(result.description).eql('Module description')
			expect(result.associatedLearning).eql(true)
			expect(result.isMandatory).eql(true)
			expect(result.duration).eql('1 minute')
			expect(result.cost).eql(1)
			expect(result.displayState).eql('')
			expect(result.template).eql('singleModule')
		})
		it('Should build a file module card', () => {
			const fileCard = getFileModuleCard(module, getBasicModuleCard(module, course)) as FileModuleCard
			expect(fileCard.fileExtAndSize).eql('pdf, 10KB')
			expect(fileCard.fileName).eql('filename')
			expect(fileCard.template).eql('file')
		})
		it('Should build a face to face module card', () => {
			const fileCard = getF2FModuleCard(module, course, getBasicModuleCard(module, course)) as F2FModuleCard
			expect(fileCard.cancellationLink).eql(undefined)
			expect(fileCard.launchLink).eql('/courses/course-id/module-id/choose-date')
			expect(fileCard.template).eql('faceToFace')
		})
		it('Should build a face to face module card that has been booked', () => {
			const mr = {eventId: 'event-id'}
			const fileCard = getF2FModuleCard(module, course, getBasicModuleCard(module, course), mr as any) as F2FModuleCard
			expect(fileCard.cancellationLink).eql(`/book/course-id/module-id/event-id/cancel`)
		})
	})
	describe('Course overview page model tests', () => {
		describe('getCoursePage tests', () => {
			it('Should return a no module course page when there are no modules', async () => {
				course.modules = []
				const result = await getCoursePage(user, course)
				expect(result.title).eql('Course title')
				expect(result.description).eql('Course description')
				expect(result.learningOutcomes).eql('Course learning outcomes')
				expect(result.status).eql(CourseStatus.PUBLISHED)
			})
			it('Should return a single module course page when there is one module', async () => {
				course.modules = [module]
				const result = (await getCoursePage(user, course)) as SingleModuleCoursePage
				expect(result.title).eql('Course title')
				expect(result.description).eql('Course description')
				expect(result.learningOutcomes).eql('Course learning outcomes')
				expect(result.status).eql(CourseStatus.PUBLISHED)
				expect(result.moduleDetails).not.eql(undefined)
				expect(result.type).eql(ModuleType.FILE)
			})
			it('Should return a blended module course page when there is more than one module', async () => {
				course.modules = [module, module]
				const result = (await getCoursePage(user, course)) as BlendedCoursePage
				expect(result.title).eql('Course title')
				expect(result.description).eql('Course description')
				expect(result.learningOutcomes).eql('Course learning outcomes')
				expect(result.status).eql(CourseStatus.PUBLISHED)
				expect(result.modules).length(2)
				expect(result.mandatoryModuleCount).eql(2)
				expect(result.type).eql('blended')
				expect(result.template).eql('blended')
			})
		})
		describe('getBlendedCoursePage tests', () => {
			it('Should require booking confirmation on associated learning modules', () => {
				const f2f = new Module('f2f', ModuleType.FACE_TO_FACE)
				f2f.optional = false
				const f2fRecord = new ModuleRecord(
					1,
					'f2f',
					'user-id',
					'course-id',
					new Date(),
					new Date(),
					'Face to face',
					'face-to-face',
					RecordState.InProgress,
					0,
					false
				)
				const linkAssoc = new Module('link', ModuleType.LINK)
				linkAssoc.optional = true
				linkAssoc.associatedLearning = true
				const file = new Module('file', ModuleType.FILE)
				file.optional = false
				file.associatedLearning = false
				const courseRecord = new CourseRecord(
					'course-id',
					'user-id',
					RecordState.InProgress,
					[f2fRecord],
					'Course Title',
					false
				)
				course.modules = [f2f, linkAssoc, file]
				const result = getBlendedCoursePage(course, courseRecord)
				expect(result.title).eql('Course title')
				expect(result.description).eql('Course description')
				expect(result.learningOutcomes).eql('Course learning outcomes')
				expect(result.status).eql(CourseStatus.PUBLISHED)
				expect(result.modules).length(3)
				expect(result.modules[0].isMandatory).eql(true)
				expect(result.modules[1].mustConfirmBooking).eql(true)
				expect(result.modules[1].isMandatory).eql(false)
				expect(result.modules[2].mustConfirmBooking).eql(false)
				expect(result.modules[2].isMandatory).eql(true)
				expect(result.mandatoryModuleCount).eql(2)
				expect(result.type).eql('blended')
				expect(result.template).eql('blended')
			})
		})
		describe('getSingleModuleCoursePage tests', () => {
			it('Should add the location to the course page when building a face-to-face course page', () => {
				const f2f = new Module('f2f', ModuleType.FACE_TO_FACE)
				f2f.location = 'London'
				const result = getSingleModuleCoursePage(course, f2f)
				expect(result.type).eql(ModuleType.FACE_TO_FACE)
				expect(result.location).eql('London')
			})
		})
	})
})
