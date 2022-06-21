import {Audience, Course, Module} from '../../model'
import {CourseRecord} from '../learnerRecordAPI/courseRecord/models/courseRecord'
import {RecordState} from '../learnerRecordAPI/models/record'
import {FullCourseRecord} from './fullCourseRecord'
import {expect} from 'chai'
import {ModuleRecord} from '../learnerRecordAPI/moduleRecord/models/moduleRecord'
import {FullModuleRecord} from './fullModuleRecord'

const USERID = 'USER001'
const COURSEID = 'TEST001'

function createDummyCourse() {
	const course = Course.create({
		COURSEID,
		title: 'test course',
		required: true,
	})
	course.audience = Audience.create({
		mandatory: true,
	})
	return course
}

function createDummyCourseRecord(state: RecordState) {
	return new CourseRecord(COURSEID, USERID, state, [], COURSEID, true)
}

function createDummyModule(moduleId: string, optional: boolean) {
	let mod = new Module(moduleId, 'Blended')
    mod.optional = optional
    return mod
}

function createDummyModuleRecord(id: number, moduleId: string, state: RecordState, optional: boolean) {
	return new ModuleRecord(
		id,
		moduleId,
		USERID,
		COURSEID,
		new Date(),
		new Date(),
		'module',
		'Blended',
		state,
		0,
		optional
	)
}

function createDummyFullModuleRecord(moduleId: string, state: RecordState, optional: boolean) {
    return new FullModuleRecord(
        createDummyModule(moduleId, optional),
        USERID,
        COURSEID,
        createDummyModuleRecord(1, moduleId, state, optional)
    )
}

describe('Test the areAllModulesComplete function', () => {
	const course = createDummyCourse()
	const record = createDummyCourseRecord(RecordState.InProgress)
	it('Should return true when all required modules are completed', () => {
		const fullRecord = new FullCourseRecord(course, USERID, record)
		fullRecord.modules.set(
			"MOD001", createDummyFullModuleRecord("MOD001", RecordState.Completed, true)
		)
        fullRecord.modules.set(
			"MDO002", createDummyFullModuleRecord("MDO002", RecordState.Completed, true)
		)

        const hasAllRequiredBeenCompleted = fullRecord.areAllRequiredModulesComplete()
        expect(hasAllRequiredBeenCompleted).to.equal(true)
	})

	it('Should return false when 1 required module is remaining', () => {
        const fullRecord = new FullCourseRecord(course, USERID, record)
		fullRecord.modules.set(
			"MOD001", createDummyFullModuleRecord("MOD001", RecordState.Completed, true)
		)
        fullRecord.modules.set(
			"MDO002", createDummyFullModuleRecord("MDO002", RecordState.Completed, true)
		)
        fullRecord.modules.set(
			"MDO003", createDummyFullModuleRecord("MDO003", RecordState.InProgress, false)
		)

        const hasAllRequiredBeenCompleted = fullRecord.areAllRequiredModulesComplete()
        expect(hasAllRequiredBeenCompleted).to.equal(false)
    })

	it('Should return true when 2 optional modules are remaining', () => {
        const fullRecord = new FullCourseRecord(course, USERID, record)
		fullRecord.modules.set(
			"MOD001", createDummyFullModuleRecord("MOD001", RecordState.NotStarted, true)
		)
        fullRecord.modules.set(
			"MDO002", createDummyFullModuleRecord("MDO002", RecordState.InProgress, true)
		)
        const hasAllRequiredBeenCompleted = fullRecord.areAllRequiredModulesComplete()
        expect(hasAllRequiredBeenCompleted).to.equal(true)
    })

})
