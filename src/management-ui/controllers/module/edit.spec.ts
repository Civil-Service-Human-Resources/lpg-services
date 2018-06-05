import {acceptedFileTypes} from './edit'
import {validator} from './edit'

describe('Checking a valid file', () => {
	it('validator should return true', () => {
		const testFileExt = '.pptx'
		const validMetaData = {...acceptedFileTypes[testFileExt]}

		expect(validator(testFileExt, validMetaData)).toBe(true)
	})
})

describe('Checking an invalid file', () => {
	it('validator should return false', () => {
		const testFileExt = '.pptx'
		const invalidMetaData = {
			thisIs: 'invalidMetaData',
		}

		expect(validator(testFileExt, invalidMetaData)).toBe(true)
	})
})
