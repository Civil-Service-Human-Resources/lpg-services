import {expect} from 'chai'
import * as config from '../../../../../config/index'
import {reprioritiseGrades} from './courseOverview'

describe('reprioritiseGrades tests', () => {
	before(() => {
		;(config as any).GRADE_PRIORITY_ORDER_ENABLED = true
		;(config as any).GRADE_PRIORITY_MAP = new Map(
			['AA', 'AO', 'EO', 'HEO', 'SEO', 'G7', 'G6', 'PB1', 'PB2', 'PB3', 'PS'].map((value, index) => [
				value.toLowerCase(),
				index,
			])
		)
	})

	it('should return empty array when grades array is empty', () => {
		expect(reprioritiseGrades([])).to.eql([])
	})

	it('should sort according to custom priority order (case insensitive) when priority values exist', () => {
		const result = reprioritiseGrades(['PB2', 'G7', 'AA', 'g6', 'AO', 'PB1'])
		expect(result).to.eql(['AA', 'AO', 'G7', 'g6', 'PB1', 'PB2'])
	})

	it('should place priority values before non-priority values', () => {
		const result = reprioritiseGrades(['XYZ', 'ABC', 'PB3', 'PB2', 'AA', 'EO'])
		expect(result).to.eql(['AA', 'EO', 'PB2', 'PB3', 'ABC', 'XYZ'])
	})

	it('should sort ascending alphabetically if custom priority order is not defined', () => {
		;(config as any).GRADE_PRIORITY_MAP = new Map<string, number>()
		const result = reprioritiseGrades(['XYZ', 'ABC', 'PB2', 'G7', 'HEO', 'g6', 'AO', 'PB1'])
		expect(result).to.eql(['ABC', 'AO', 'g6', 'G7', 'HEO', 'PB1', 'PB2', 'XYZ'])
	})

	it('should not sort or use the custom priority order if grade priority order is not enabled', () => {
		;(config as any).GRADE_PRIORITY_ORDER_ENABLED = false
		const result = reprioritiseGrades(['XYZ', 'ABC', 'PB2', 'G7', 'HEO', 'g6', 'AO', 'PB1'])
		expect(result).to.eql(['XYZ', 'ABC', 'PB2', 'G7', 'HEO', 'g6', 'AO', 'PB1'])
	})
})

