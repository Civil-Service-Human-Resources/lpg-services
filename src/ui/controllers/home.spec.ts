import {expect} from 'chai'
import * as sinon from 'sinon'
import {Course} from '../../lib/model'
import {getBasicCourseRecord} from '../../lib/model.spec'
import {CourseRecord} from '../../lib/service/cslService/models/courseRecord'
import * as controller from './home'

describe('home controller tests', () => {
	describe('getRequiredLearning tests', () => {
		const sandbox = sinon.createSandbox()
		it('Should return the correct number of required learning courses', () => {
			const notStartedCourse = new Course('not-started')
			const notCompletedCourse = new Course('not-completed')
			sandbox.stub(notCompletedCourse, 'getDisplayState').returns('IN_PROGRESS')
			const completedCourse = new Course('completed')
			sandbox.stub(completedCourse, 'getDisplayState').returns('COMPLETED')
			const requiredCourses = [notStartedCourse, notCompletedCourse, completedCourse]

			const notCompletedRecord = getBasicCourseRecord('not-completed')
			const completedRecord = getBasicCourseRecord('completed')
			const courseRecordMap = new Map<string, CourseRecord>([
				[notCompletedRecord.courseId, notCompletedRecord],
				[completedRecord.courseId, completedRecord],
			])

			const result = controller.getRequiredLearning(requiredCourses, courseRecordMap)

			expect(result[0].id).to.equal('not-started')
			expect(result[0].record).to.equal(undefined)
			expect(result[1].id).to.equal('not-completed')
			expect(result[1].record!.state).to.equal('IN_PROGRESS')

			expect(courseRecordMap.size).to.equal(0)
		})
	})
})
