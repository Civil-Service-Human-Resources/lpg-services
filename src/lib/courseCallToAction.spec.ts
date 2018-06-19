import {
	constructCourseCallToAction,
	CourseActionType,
} from 'lib/courseCallToAction'

import {CourseRecord, ModuleRecord} from 'lib/learnerrecord'
import {Course, Module, User} from 'lib/model'

const courseSkeletonData: any = {
	id: 'UT0',
	title: 'Unit Test Course Skeleton',

	description: '',
	duration: '',
	learningOutcomes: '',
	price: 'Free',
	shortDescription: '',

	modules: [{}],
}

const moduleData: {[module: string]: any} = {
	faceToFace: {
		description: '',
		duration: null,
		id: 'F2F',
		price: null,
		productCode: null,
		title: 'Face to face module',
		type: 'face-to-face',

		audiences: [
			{
				areasOfWork: [],
				departments: [],
				frequency: null,
				grades: [],
				interests: [],
				mandatory: false,
			},
		],
		events: [
			{
				capacity: 30,
				date: new Date(new Date().setDate(new Date().getDate() - 30)),
				id: 'past',
				location: 'London',
			},
			{
				capacity: 30,
				date: new Date(new Date().setDate(new Date().getDate() + 30)),
				id: 'future',
				location: 'London',
			},
		],
	},
	file: {
		description: 'File',
		duration: 1000,
		fileSize: null,
		id: 'FILE',
		type: 'file',

		price: null,
		title: 'tes',

		url: null,

		audiences: [
			{
				areasOfWork: [],
				departments: [],
				frequency: null,
				grades: [],
				interests: [],
				mandatory: false,
			},
		],
		events: [],
	},
}

const testUser = User.create({
	accessToken: '',
	id: '3c706a70-3fff-4e7b-ae7f-102c1d46f569',
	userName: 'learner@domain.com',

	department: 'co',
	grade: 'PB3',

	areasOfWork: ['Commercial'],
	otherAreasOfWork: ['Finance', 'Fraud, error, debt and grants', 'Digital'],
	roles: ['LEARNER'],

	sessionIndex: '',
})

const recordData: CourseRecord = {
	courseId: courseSkeletonData.id,
	modules: [],
	state: 'IN_PROGRESS',
	userId: testUser.id,
}

describe('Course Call to Actions', () => {
	let course: Course
	let modifier: string
	beforeEach(() => {
		course = initCourse()
	})
	it('should return a CourseCallToAction struct', () => {
		expect(constructCourseCallToAction(course, testUser)).toBeDefined()
	})

	describe('For unrequired courses', () => {
		describe('That are not in the learning plan', () => {
			it('isInLearningPlan should be false', () => {
				expect(
					constructCourseCallToAction(course, testUser).isInLearningPlan
				).toBeFalsy()
			})

			it('for bookable courses it should return "Book"', () => {
				course = initCourse()
				course.modules = initModules(['faceToFace'])
				const cta = constructCourseCallToAction(course, testUser)
				expect(cta.message).toEqual('Book')
			})

			describe('on search page', () => {
				beforeEach(() => {
					modifier = 'search'
				})

				it('should return Add (to learning plan)', () => {
					course.modules = initModules(['file'])
					const cta = constructCourseCallToAction(course, testUser, modifier)
					expect(cta.actionToPlan!.type).toEqual(CourseActionType.Add)
				})
			})

			describe('on home page', () => {
				beforeEach(() => {
					modifier = 'home'
				})

				it('should not return Add (to learning plan)', () => {
					course.modules = initModules(['file'])
					const cta = constructCourseCallToAction(course, testUser, modifier)
					expect(cta.actionToPlan).toBeUndefined()
				})
			})
		})

		describe('That are in the learning plan', () => {
			beforeEach(() => {
				course = initCourse(true)
			})
			it('should be in the learning plan', () => {
				expect(
					constructCourseCallToAction(course, testUser).isInLearningPlan
				).toEqual(true)
			})

			describe('on the search page', () => {
				beforeEach(() => {
					modifier = 'search'
				})
				it('should not have any actions to plan', () => {
					expect(
						constructCourseCallToAction(course, testUser, modifier).actionToPlan
					).toBeUndefined()
				})
			})
			describe('on the home page', () => {
				beforeEach(() => {
					modifier = 'home'
				})
				describe('for unrequired courses', () => {
					it('should have actions to plan', () => {
						expect(
							constructCourseCallToAction(course, testUser, modifier)
								.actionToPlan
						).toBeDefined()
					})
					describe('for face to face courses', () => {
						beforeEach(() => {
							course.modules = initModules(['faceToFace'])
						})
						it('should show cancel if the date today has not passed the event date', () => {
							course.record!.modules.push(initModuleRecord('future'))
							expect(
								constructCourseCallToAction(course, testUser, modifier).message
							).toEqual('cancel')
						})
						it('should have actions to record if the date has passed the event date', () => {
							course.record!.modules.push(initModuleRecord('past'))

							const cta = constructCourseCallToAction(
								course,
								testUser,
								modifier
							)
							expect(cta.actionToRecord).toBeDefined()
						})
					})
				})
			})
		})
	})

	describe('For required courses', () => {
		it('should not have any actions to learning plan on search pages', () => {
			course.modules = initModules(['file'])
			course.isRequired = () => true
			const cta = constructCourseCallToAction(course, testUser, 'search')

			expect(cta.actionToPlan).toBeUndefined()
		})
		it('should not have any actions to learning plan on home', () => {
			course.modules = initModules(['file'])
			course.isRequired = () => true
			const cta = constructCourseCallToAction(course, testUser, 'home')
			expect(cta.actionToPlan).toBeUndefined()
		})
		describe('that are bookable', () => {
			beforeEach(() => {
				course = initCourse(true)
				course.modules = initModules(['faceToFace'])
				course.isRequired = () => true
			})
			it('should return "Book" for bookable courses', () => {
				const cta = constructCourseCallToAction(course, testUser)
				expect(cta.message).toBe('Book')
			})

			it('should not have cancel actions if booked', () => {
				course.record!.modules[0] = initModuleRecord('future')
				const cta = constructCourseCallToAction(course, testUser, 'home')

				// record.modules && record.modules.length && record.modules[0].eventId
				expect(cta.message).toEqual('cancel')
			})
		})
	})

	/*is in record
        N
        is face to face?
            Y book
            N start#modules
                Required?
                Y nothing
                N Add to learning plan
        Y
        Booked?
            Y Cancel
            N state is null or 'archived'?
                Y not required?
                    Add to LP
        */
})

function initCourse(withRecord?: boolean): Course {
	const c = Course.create(courseSkeletonData)
	if (withRecord) {
		c.record = {
			courseId: c.id,
			modules: [],
			state: 'IN_PROGRESS',
			userId: testUser.id,
		}
	}
	return c
}

function initModules(moduleNames: string[]): Module[] {
	const modules: Module[] = []
	for (const module of moduleNames) {
		modules.push(Module.create(moduleData[module]))
	}
	return modules
}

type EventRelativeToToday = 'past' | 'future'

function initModuleRecord(rel: EventRelativeToToday): ModuleRecord {
	return {
		eventId: rel,
		moduleId: 'F2F',
	}
}
