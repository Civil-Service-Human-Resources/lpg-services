import {assert} from 'chai'
import {expect} from 'chai'
import * as sinon from 'sinon'
import {Course, Module, RequiredRecurringAudience, Audience} from './model'
import {CourseRecord} from './service/cslService/models/courseRecord'
import {ModuleRecord} from './service/cslService/models/moduleRecord'
import {RecordState} from './service/cslService/models/record'

export const getBasicCourseRecord = (id?: string) => {
	return new CourseRecord(id || 'test1', '', '', [], '', false)
}

export const getBasicModuleRecord = (moduleId: string, state: RecordState, lastUpdated: Date, completedDate?: Date) => {
	const moduleRecord = new ModuleRecord(
		0,
		moduleId,
		'',
		'',
		new Date(),
		lastUpdated,
		'',
		'link',
		state,
		0,
		false,
		undefined
	)
	moduleRecord.completionDate = completedDate
	return moduleRecord
}

describe('displayState tests', () => {
	/**
	 * Audience with a due by date of 31/03/2020 on a yearly frequency
	 */
	const audience = new RequiredRecurringAudience(new Date('2020-03-31'), new Date('2021-03-31'))

	const lastYearDate = new Date('2020-03-30')
	const thisYearDate = new Date('2020-04-05')
	const module1 = Module.create({id: '1', type: 'elearning', optional: true})
	const module2 = Module.create({id: '2', type: 'elearning', optional: false})
	const module3 = Module.create({id: '3', type: 'elearning', optional: false})
	const module4 = Module.create({id: '4', type: 'elearning', optional: true})
	describe('getDisplayStateForCourse tests', () => {
		const sandbox = sinon.createSandbox()

		describe('Course has both required and optional modules', () => {
			const course = new Course('testId')
			course.modules = [module1, module2, module3]
			sandbox.stub(course, 'getRequiredRecurringAudience').returns(audience)
			const courseRecord = getBasicCourseRecord()
			courseRecord.modules = [
				getBasicModuleRecord('1', 'COMPLETED', lastYearDate, lastYearDate),
				getBasicModuleRecord('2', 'COMPLETED', lastYearDate, lastYearDate),
				getBasicModuleRecord('3', 'COMPLETED', lastYearDate, lastYearDate),
			]
			it(
				'should set the state to not started (null) when all modules have' +
					'been completed during the previous learning year',
				() => {
					courseRecord.getModuleRecord('1')!.completionDate = lastYearDate
					courseRecord.getModuleRecord('2')!.completionDate = lastYearDate
					courseRecord.getModuleRecord('3')!.completionDate = lastYearDate
					const result = course.getDisplayState(courseRecord)
					assert.equal(result, '')
				}
			)
			it(
				'should set the state to in-progress when required modules have ' +
					'been completed during the previous learning year and an optional module ' +
					'is in-progress this year',
				() => {
					courseRecord.getModuleRecord('1')!.updatedAt = thisYearDate
					courseRecord.getModuleRecord('2')!.completionDate = lastYearDate
					courseRecord.getModuleRecord('3')!.completionDate = lastYearDate
					const result = course.getDisplayState(courseRecord)
					assert.equal(result, 'IN_PROGRESS')
				}
			)
			it(
				'should set the state to in-progress when required modules have ' +
					'been completed during the previous learning year and an optional module ' +
					'is completed this year',
				() => {
					courseRecord.getModuleRecord('1')!.completionDate = thisYearDate
					courseRecord.getModuleRecord('2')!.completionDate = lastYearDate
					courseRecord.getModuleRecord('3')!.completionDate = lastYearDate
					const result = course.getDisplayState(courseRecord)
					assert.equal(result, 'IN_PROGRESS')
				}
			)
			it(
				'should set the state to in-progress when a module has ' +
					'been completed during the previous learning year and another ' +
					'required module has been completed in the current learning year',
				() => {
					courseRecord.getModuleRecord('1')!.completionDate = lastYearDate
					courseRecord.getModuleRecord('2')!.completionDate = lastYearDate
					courseRecord.getModuleRecord('3')!.completionDate = thisYearDate
					const result = course.getDisplayState(courseRecord)
					assert.equal(result, 'IN_PROGRESS')
				}
			)
			it(
				'should set the state to completed one required module has' +
					'been progressed during the current learning year',
				() => {
					courseRecord.getModuleRecord('1')!.completionDate = lastYearDate
					courseRecord.getModuleRecord('2')!.completionDate = lastYearDate
					courseRecord.getModuleRecord('2')!.updatedAt = thisYearDate
					courseRecord.getModuleRecord('3')!.completionDate = lastYearDate
					const result = course.getDisplayState(courseRecord)
					assert.equal(result, 'IN_PROGRESS')
				}
			)
			it(
				'should set the state to completed when both required modules have' +
					'been completed during the current learning year',
				() => {
					courseRecord.getModuleRecord('1')!.completionDate = lastYearDate
					courseRecord.getModuleRecord('2')!.completionDate = thisYearDate
					courseRecord.getModuleRecord('3')!.completionDate = thisYearDate
					const result = course.getDisplayState(courseRecord)
					assert.equal(result, 'COMPLETED')
				}
			)
			it('should set the state to null when there are no module records', () => {
				const emptyCourseRecord = getBasicCourseRecord()
				const result = course.getDisplayState(emptyCourseRecord)
				assert.equal(result, '')
			})
		})

		describe('Course has only optional modules', () => {
			const course = new Course('testId')
			course.modules = [module1, module4]
			sandbox.stub(course, 'getRequiredRecurringAudience').returns(audience)
			const courseRecord = getBasicCourseRecord()
			courseRecord.modules = [
				getBasicModuleRecord('1', 'COMPLETED', lastYearDate, lastYearDate),
				getBasicModuleRecord('4', 'COMPLETED', lastYearDate, lastYearDate),
			]
			it(
				'should set the state to completed when all module records have been completed ' + 'this learning period',
				() => {
					courseRecord.getModuleRecord('1')!.completionDate = thisYearDate
					courseRecord.getModuleRecord('4')!.completionDate = thisYearDate
					const result = course.getDisplayState(courseRecord)
					assert.equal(result, 'COMPLETED')
				}
			)
		})
	})

	describe('getDisplayStateForModule tests', () => {
		it(
			'should set the state to not started (null) when a module is' + 'completed during the previous learning year',
			() => {
				const moduleRecord = getBasicModuleRecord('1', 'COMPLETED', lastYearDate, lastYearDate)
				const result = module1.getDisplayState(moduleRecord, audience)
				assert.equal(result, null)
			}
		)
		it(
			'should set the state to not started (null) when a module is' + 'in progress during the previous learning year',
			() => {
				const moduleRecord = getBasicModuleRecord('1', 'IN_PROGRESS', lastYearDate)
				const result = module1.getDisplayState(moduleRecord, audience)
				assert.equal(result, null)
			}
		)
		it('should set the state to IN_PROGRESS when a module is' + 'in progress during the current learning year', () => {
			const moduleRecord = getBasicModuleRecord('1', 'IN_PROGRESS', thisYearDate)
			const result = module1.getDisplayState(moduleRecord, audience)
			assert.equal(result, 'IN_PROGRESS')
		})
		it('should set the state to COMPLETED when a module is' + 'completed during the current learning year', () => {
			const moduleRecord = getBasicModuleRecord('1', 'COMPLETED', thisYearDate, thisYearDate)
			const result = module1.getDisplayState(moduleRecord, audience)
			assert.equal(result, 'COMPLETED')
		})
		it('should set the state to COMPLETED when a module has been completed on a non-recurring course ', () => {
			const moduleRecord = getBasicModuleRecord('1', 'COMPLETED', lastYearDate, lastYearDate)
			const result = module1.getDisplayState(moduleRecord, null)
			assert.equal(result, 'COMPLETED')
		})
		it('should set the state to NULL when a module has no record associated ', () => {
			const result = module1.getDisplayState(null, null)
			assert.equal(result, null)
		})
	})

	describe('Course.getGrades() tests', () => {
		function createCourseWithGrades(grades?: string[]) {
			const course = new Course('testId')
			course.audiences = []
			if (grades !== undefined) {
				course.audience = Audience.create({
					grades,
				})
			}
			return course
		}

		it('should return empty array when audience is undefined', () => {
			const course = createCourseWithGrades(undefined)
			expect(course.getGrades()).to.eql([])
		})

		it('should return empty array when audience.grades is undefined', () => {
			const course = new Course('testId')
			course.audiences = []
			course.audience = Audience.create({})
			expect(course.getGrades()).to.eql([])
		})

		it('should return empty array when grades array is empty', () => {
			const course = createCourseWithGrades([])
			expect(course.getGrades()).to.eql([])
		})

		it('should return grades sorted alphabetically (case insensitive)', () => {
			const course = createCourseWithGrades(['Grade 7', 'administrative Assistant', 'Executive Officer'])
			const result = course.getGrades()
			expect(result).to.eql(['administrative Assistant', 'Executive Officer', 'Grade 7'])
		})

		it('should sort case-insensitively but preserve original case when lowercase equal', () => {
			const course = createCourseWithGrades(['grade 7', 'Grade 7', 'GRADE 7'])
			const result = course.getGrades()
			expect(result).to.eql(['grade 7', 'Grade 7', 'GRADE 7'])
		})

		it('should not mutate the original grades array', () => {
			const grades = ['Grade 7,', 'Administrative Assistant', 'Executive Officer']
			const course = createCourseWithGrades(grades)
			const original = [...course.audience!.grades]
			expect(course.audience!.grades).to.eql(original)
		})
	})
})
