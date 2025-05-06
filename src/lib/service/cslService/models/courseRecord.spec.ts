import {expect} from 'chai'

import {Module, ModuleType} from '../../../model'
import {CourseRecord} from './courseRecord'
import {ModuleRecord} from './moduleRecord'
import {RecordState} from './record'

const requiredModule1 = new Module('required001', ModuleType.LINK)
requiredModule1.optional = false
const requiredModule2 = new Module('required002', ModuleType.LINK)
requiredModule2.optional = false

const optModule1 = new Module('optional001', ModuleType.LINK)
optModule1.optional = true
const optModule2 = new Module('optional002', ModuleType.LINK)
optModule2.optional = true

function moduleRecordFromModule(module: Module, state: RecordState) {
	return new ModuleRecord(
		0,
		module.id,
		'',
		'',
		new Date(),
		new Date(),
		'',
		'link',
		state,
		0,
		module.optional,
		undefined
	)
}

const mods = [requiredModule1, requiredModule2]

const optionalMods = [optModule1, optModule2]

describe('Should return course completion status', () => {
	it('Should return "true" when all required modules are completed', () => {
		const modRecords = mods.filter(m => !m.optional).map(m => moduleRecordFromModule(m, 'COMPLETED'))
		const courseRecord = new CourseRecord('Test001', '', 'IN_PROGRESS', modRecords, '', false)
		const completed = courseRecord.areAllRelevantModulesComplete(mods)
		expect(completed)
	})

	it('Should return "true" when all required modules are completed, with an optional module', () => {
		const modules = [optModule1, requiredModule1, requiredModule2]
		const modRecords = mods.map(m => moduleRecordFromModule(m, 'COMPLETED'))
		modRecords.unshift(moduleRecordFromModule(optModule1, 'COMPLETED'))
		const courseRecord = new CourseRecord('Test001', '', 'COMPLETED', modRecords, '', false)
		const completed = courseRecord.areAllRelevantModulesComplete(modules)
		expect(completed)
	})

	it('Should return "false" when one required module is still in progress', () => {
		const modRecords = mods.map(m => moduleRecordFromModule(m, 'COMPLETED'))
		modRecords[0].state = 'IN_PROGRESS'
		const courseRecord = new CourseRecord('Test001', '', 'IN_PROGRESS', modRecords, '', false)
		const completed = courseRecord.areAllRelevantModulesComplete(mods)
		expect(!completed)
	})

	it('Should return "false" when both required modules are still in progress but optional is completed', () => {
		const modRecords = mods.map(m => moduleRecordFromModule(m, 'COMPLETED'))
		modRecords.push(moduleRecordFromModule(optModule1, 'COMPLETED'))
		modRecords[0].state = 'IN_PROGRESS'
		modRecords[1].state = 'IN_PROGRESS'
		modRecords[2].state = 'COMPLETED'
		const courseRecord = new CourseRecord('Test001', '', 'IN_PROGRESS', modRecords, '', false)
		const completed = courseRecord.areAllRelevantModulesComplete(mods)
		expect(!completed)
	})

	it('Should return "true" when all optional modules are completed on a course containing only optional modules', () => {
		const modRecords = optionalMods.map(m => moduleRecordFromModule(m, 'COMPLETED'))
		modRecords[0].state = 'COMPLETED'
		modRecords[1].state = 'COMPLETED'
		const courseRecord = new CourseRecord('Test001', '', 'IN_PROGRESS', modRecords, '', false)
		const completed = courseRecord.areAllRelevantModulesComplete(mods)
		expect(completed)
	})
})

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
