import {expect} from 'chai'
import {randomBytes} from 'crypto'
import {AcceptableMetaInfo, acceptedFileTypes, validator} from './edit'

function metaConstructor(expectedMeta: AcceptableMetaInfo): any {
	const validMeta: {[key: string]: string} = {}

	expectedMeta.keys.forEach((key: string) => {
		validMeta[key] = 'valid key'
	})
	expectedMeta.values.forEach((value: string) => {
		validMeta[randomBytes(2).toString('hex')] = value
	})

	return {data: [validMeta]}
}

describe('File validator tests', () => {
	it('should return true for valid file type', () => {
		const testFileExt = '.pptx'
		const expectedMeta = acceptedFileTypes[testFileExt]

		const validMeta = metaConstructor(expectedMeta)

		const result: boolean = validator(testFileExt, validMeta)

		expect(result).to.equal(true)
	})

	it('should return false for invalid file type', () => {
		const testFileExt = '.pptx'
		const invalidMetaData = {
			data: [{thisIs: 'invalidMetaData'}],
		}
		expect(validator(testFileExt, invalidMetaData)).to.equal(false)
	})

	it('should return true for an uploaded file with an extension we support', () => {
		const testFileExt = '.pptx'
		expect(Object.keys(acceptedFileTypes).indexOf(testFileExt) > -1).to.equal(
			true
		)
	})

	it('should return true for an uploaded video with an extension we support', () => {
		const testFileExt = '.mp4'
		expect(Object.keys(acceptedFileTypes).indexOf(testFileExt) > -1).to.equal(
			true
		)
	})
})
