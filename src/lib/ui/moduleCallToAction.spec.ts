import {initCourse, initModules, testUser} from '../courseCallToAction.spec'

import {
	constructModuleCta,
	ModuleCallToActionProps,
} from 'lib/ui/moduleCallToAction'

import {CourseActionType} from 'lib/courseCallToAction'

import {Course} from 'lib/model'

describe('Module call to actions', () => {
	let course: Course
	let modifier: string
	let cta: ModuleCallToActionProps
	beforeEach(() => {
		course = initCourse(true)
		course.modules = initModules(['file'])
	})

	it('should return a ModuleCallToAction struct', () => {
		cta = constructModuleCta(
			course.id,
			course.modules[0],
			testUser,
			'IN_PROGRESS',
			course.record!
		)

		expect(cta).toBeDefined()
	})

	describe('on the search page', () => {
		beforeEach(() => {
			modifier = 'search'
		})
		it('should have a URL going to the course overview page modules section', () => {
			cta = constructModuleCta(
				course.id,
				course.modules[0],
				testUser,
				'IN_PROGRESS',
				course.record!,
				modifier
			)
			expect(cta.url).toContain('#modules')
		})
		describe('that are bookable', () => {
			it('should go to the course overview page (modules section) if it is part of a blended course', () => {
				cta = constructModuleCta(
					course.id,
					course.modules[0],
					testUser,
					'',
					course.record!,
					modifier
				)
				expect(cta.url).toContain('#modules')
			})
		})
	})

	describe('that are required', () => {
		it('should not have actions to learning plan', () => {
			expect(cta.actionToPlan).toBeUndefined()
		})
		describe('on the search page', () => {
			it('should show "Already added to your learning Plan"', () => {
				expect(cta.message).toBe('Already in your learning plan')
			})
		})
	})

	describe('that is not in the learning plan', () => {
		describe('that are bookable', () => {
			beforeEach(() => {
				course = initCourse(false)
				course.modules = initModules(['faceToFace'])
			})
			describe('on the search page', () => {
				it('should go to the course overview page (modules section) if it is part of a blended course', () => {
					modifier = 'search'
					cta = constructModuleCta(
						course.id,
						course.modules[0],
						testUser,
						'',
						course.record!,
						modifier
					)
					expect(cta.url).toContain('#modules')
				})

				it('should return Add (to learning plan)', () => {
					expect(cta.actionToPlan!.type).toEqual(CourseActionType.Add)
				})
			})
			describe('on the course overview page', () => {
				it('should show "action_BOOK" action', () => {
					modifier = 'overview'
					cta = constructModuleCta(
						course.id,
						course.modules[0],
						testUser,
						'',
						course.record!,
						modifier
					)
					expect(cta.url).toContain('/book/')
					expect(cta.learningAction.text).toEqual('action_BOOK')
				})
			})
		})
	})
	describe('that are in the learning plan', () => {
		describe('on the search page', () => {
			it('should return not have any actions', () => {
				cta = constructModuleCta(
					course.id,
					course.modules[0],
					testUser,
					'',
					course.record!,
					'search'
				)
				expect(cta.actionToPlan).toBeUndefined()
			})
		})
	})
})
