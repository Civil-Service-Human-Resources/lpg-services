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

const mods = [mod1, mod2, mod3]

describe('Should return course completion status', () => {

	it('Should return "true" when all required modules are completed', () => {
		const modRecords = mods.filter(m => !m.optional).map(m => new ModuleRecord(0, m.id, '', '', new Date(),
		new Date(), '', 'link', RecordState.Completed, 0, m.optional, undefined))
		const courseRecord = new CourseRecord('Test001', '', RecordState.InProgress, modRecords, '', false)
		const completed = courseRecord.areAllRequiredModulesComplete(mods)
		expect(completed === true)
	})

	it('Should return "true" when all required modules are completed, with an optional module', () => {
		const modRecords = mods.map(m => new ModuleRecord(0, m.id, '', '', new Date(), new Date(), '',
		'link', RecordState.Completed, 0, m.optional, undefined))
		modRecords[2].state = RecordState.InProgress
		const courseRecord = new CourseRecord('Test001', '', RecordState.InProgress, modRecords, '', false)
		const completed = courseRecord.areAllRequiredModulesComplete(mods)
		expect(completed === true)
	})

	it('Should return "false" when one required module is still in progress', () => {
		const modRecords = mods.map(m => new ModuleRecord(0, m.id, '', '', new Date(),
		new Date(), '', 'link', RecordState.Completed, 0, m.optional, undefined))
		modRecords[0].state = RecordState.InProgress
		const courseRecord = new CourseRecord('Test001', '', RecordState.InProgress, modRecords, '', false)
		const completed = courseRecord.areAllRequiredModulesComplete(mods)
		expect(completed === false)
	})

	it('Should return "false" when both required modules are still in progress but optional is completed', () => {
		const modRecords = mods.map(m => new ModuleRecord(0, m.id, '', '', new Date(),
		new Date(), '', 'link', RecordState.Completed, 0, m.optional, undefined))
		console.log(modRecords.length)
		modRecords[0].state = RecordState.InProgress
		modRecords[1].state = RecordState.InProgress
		modRecords[2].state = RecordState.Completed
		const courseRecord = new CourseRecord('Test001', '', RecordState.InProgress, modRecords, '', false)
		const completed = courseRecord.areAllRequiredModulesComplete(mods)
		expect(completed === false)
	})
})
