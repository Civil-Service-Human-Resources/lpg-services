import {expect} from 'chai'
import {initCourse, initModules, testUser} from 'lib/ui/courseCallToAction.spec'

import {
	constructModuleCta,
	ModuleCallToActionProps,
} from 'lib/ui/moduleCallToAction'

import {CourseActionType} from 'lib/ui/courseCallToAction'

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
		/* tslint:disable:no-unused-expression */
		expect(cta).to.exist
		/* tslint:enable */
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
			expect(cta.url).to.contain('#modules')
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
				expect(cta.url).to.contain('#modules')
			})
		})
	})

	describe('that are required', () => {
		it('should not have actions to learning plan', () => {
			/* tslint:disable:no-unused-expression */
			expect(cta.actionToPlan).to.be.undefined
			/* tslint:enable */
		})
		describe('on the search page', () => {
			it('should show "Already added to your learning Plan"', () => {
				expect(cta.message).to.be.equal('Already in your learning plan')
			})
		})
	})

	describe('that is not in the learning plan', () => {
		describe('that are bookable', () => {
			beforeEach(() => {
				course = initCourse(false)
				course.modules = initModules(['faceToFace'])
				modifier = 'search'
				cta = constructModuleCta(
					course.id,
					course.modules[0],
					testUser,
					'',
					course.record!,
					modifier
				)
			})
			describe('on the search page', () => {
				it('should go to the course overview page (modules section) if it is part of a blended course', () => {
					expect(cta.url).to.contain('#modules')
				})

				it('should return Add (to learning plan)', () => {
					console.log(cta)
					expect(cta.actionToPlan!.type).to.be.equal(CourseActionType.Add)
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
					expect(cta.url).to.contain('/book/')
					expect(cta.learningAction.text).to.be.equal('action_BOOK')
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
				/* tslint:disable:no-unused-expression */
				expect(cta.actionToPlan).to.be.undefined
				/* tslint:enable */
			})
		})
	})
})
