import { expect } from 'chai'

import { Module } from '../../../../model'
import { RecordState } from '../../models/record'
import { ModuleRecord } from '../../moduleRecord/models/moduleRecord'
import { CourseRecord } from './courseRecord'

const mod1 = new Module('MOD001', 'link')
mod1.optional = false
const mod2 = new Module('MOD002', 'link')
mod2.optional = false
const mod3 = new Module('MOD003', 'link')
mod3.optional = true
const mod4 = new Module('MOD003', 'link')
mod3.optional = true

const mods = [mod1, mod2, mod3]

const optionalMods = [mod3, mod4]

describe('Should return course completion status', () => {

	it('Should return "true" when all required modules are completed', () => {
		const modRecords = mods.filter(m => !m.optional).map(m => new ModuleRecord(0, m.id, '', '', new Date(),
		new Date(), '', 'link', RecordState.Completed, 0, m.optional, undefined))
		const courseRecord = new CourseRecord('Test001', '', RecordState.InProgress, modRecords, '', false)
		const completed = courseRecord.areAllRelevantModulesComplete(mods)
		expect(completed === true)
	})

	it('Should return "true" when all required modules are completed, with an optional module', () => {
		const modRecords = mods.map(m => new ModuleRecord(0, m.id, '', '', new Date(), new Date(), '',
		'link', RecordState.Completed, 0, m.optional, undefined))
		modRecords[2].state = RecordState.InProgress
		const courseRecord = new CourseRecord('Test001', '', RecordState.InProgress, modRecords, '', false)
		const completed = courseRecord.areAllRelevantModulesComplete(mods)
		expect(completed === true)
	})

	it('Should return "false" when one required module is still in progress', () => {
		const modRecords = mods.map(m => new ModuleRecord(0, m.id, '', '', new Date(),
		new Date(), '', 'link', RecordState.Completed, 0, m.optional, undefined))
		modRecords[0].state = RecordState.InProgress
		const courseRecord = new CourseRecord('Test001', '', RecordState.InProgress, modRecords, '', false)
		const completed = courseRecord.areAllRelevantModulesComplete(mods)
		expect(completed === false)
	})

	it('Should return "false" when both required modules are still in progress but optional is completed', () => {
		const modRecords = mods.map(m => new ModuleRecord(0, m.id, '', '', new Date(),
		new Date(), '', 'link', RecordState.Completed, 0, m.optional, undefined))
		modRecords[0].state = RecordState.InProgress
		modRecords[1].state = RecordState.InProgress
		modRecords[2].state = RecordState.Completed
		const courseRecord = new CourseRecord('Test001', '', RecordState.InProgress, modRecords, '', false)
		const completed = courseRecord.areAllRelevantModulesComplete(mods)
		expect(completed === false)
	})

	it('Should return "true" when all optional modules are completed on a course containing only optional modules', () => {
		const modRecords = optionalMods.map(m => new ModuleRecord(0, m.id, '', '', new Date(),
		new Date(), '', 'link', RecordState.Completed, 0, m.optional, undefined))
		modRecords[0].state = RecordState.Completed
		modRecords[1].state = RecordState.Completed
		const courseRecord = new CourseRecord('Test001', '', RecordState.InProgress, modRecords, '', false)
		const completed = courseRecord.areAllRelevantModulesComplete(mods)
		expect(completed === true)
	})
})

describe('Should upsert (update OR insert) a module record', () => {
	it('should update the existing module record', () => {
		const moduleRecordId = 1

		const mod = new ModuleRecord(moduleRecordId, '', '', '', new Date(),
		new Date(), '', 'link', RecordState.InProgress, 0, false, undefined)

		const courseRecord = new CourseRecord('Test001', '', RecordState.InProgress, [mod], '', false)

		const updatedMod = new ModuleRecord(moduleRecordId, '', '', '', new Date(),
		new Date(), '', 'link', RecordState.Completed, 0, false, undefined)

		courseRecord.upsertModuleRecord(updatedMod.id, updatedMod)

		expect(courseRecord.modules.length === 1)
		expect(courseRecord.modules[0].isCompleted())
	})

	it('should insert the missing module record', () => {

		const mod = new ModuleRecord(1, '', '', '', new Date(),
		new Date(), '', 'link', RecordState.InProgress, 0, false, undefined)

		const courseRecord = new CourseRecord('Test001', '', RecordState.InProgress, [mod], '', false)

		const updatedMod = new ModuleRecord(2, '', '', '', new Date(),
		new Date(), '', 'link', RecordState.Completed, 0, false, undefined)

		courseRecord.upsertModuleRecord(updatedMod.id, updatedMod)

		expect(courseRecord.modules.length === 2)
		expect(courseRecord.modules[0].isInProgress())
		expect(courseRecord.modules[1].isCompleted())
	})
})
