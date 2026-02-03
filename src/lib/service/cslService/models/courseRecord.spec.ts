import {expect} from 'chai'

import {Module} from '../../../model'
import {CourseRecord} from './courseRecord'
import {ModuleRecord} from './moduleRecord'

const requiredModule1 = new Module('required001', 'link')
requiredModule1.optional = false
const requiredModule2 = new Module('required002', 'link')
requiredModule2.optional = false

const optModule1 = new Module('optional001', 'link')
optModule1.optional = true
const optModule2 = new Module('optional002', 'link')
optModule2.optional = true

describe('Should upsert (update OR insert) a module record', () => {
	it('should update the existing module record', () => {
		const moduleRecordId = 1

		const mod = new ModuleRecord(
			moduleRecordId,
			'',
			'',
			'',
			new Date(),
			new Date(),
			'',
			'link',
			'IN_PROGRESS',
			0,
			false,
			undefined
		)

		const courseRecord = new CourseRecord('Test001', '', 'IN_PROGRESS', [mod], '', false)

		const updatedMod = new ModuleRecord(
			moduleRecordId,
			'',
			'',
			'',
			new Date(),
			new Date(),
			'',
			'link',
			'COMPLETED',
			0,
			false,
			undefined
		)

		courseRecord.upsertModuleRecord(updatedMod.id, updatedMod)

		expect(courseRecord.modules.length === 1)
		expect(courseRecord.modules[0].isCompleted())
	})

	it('should insert the missing module record', () => {
		const mod = new ModuleRecord(1, '', '', '', new Date(), new Date(), '', 'link', 'IN_PROGRESS', 0, false, undefined)

		const courseRecord = new CourseRecord('Test001', '', 'IN_PROGRESS', [mod], '', false)

		const updatedMod = new ModuleRecord(
			2,
			'',
			'',
			'',
			new Date(),
			new Date(),
			'',
			'link',
			'COMPLETED',
			0,
			false,
			undefined
		)

		courseRecord.upsertModuleRecord(updatedMod.id, updatedMod)

		expect(courseRecord.modules.length === 2)
		expect(courseRecord.modules[0].isInProgress())
		expect(courseRecord.modules[1].isCompleted())
	})
})
