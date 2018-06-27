import {expect} from 'chai'
import {validatePurchaseOrder} from './booking'

describe('Purchase Order validation', () => {
	it('should not return any errors for a correct PO', () => {
		expect(validatePurchaseOrder('AB12345')).to.eql([])
	})

	it('should only return errors.po-empty', () => {
		expect(validatePurchaseOrder('')).to.eql(['errors.po-empty'])
	})

	it('should only return errors.po-too-short', () => {
		expect(validatePurchaseOrder('1')).to.eql(['errors.po-too-short'])
	})

	it('should return errors.po-special-characters AND errors.po-too-long', () => {
		expect(
			validatePurchaseOrder(':this,is#an:invalidPOthatsWayTooLong')
		).to.eql(['errors.po-too-long', 'errors.po-special-characters'])
	})
})
