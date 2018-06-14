import {validatePurchaseOrder} from './booking'

describe('Purchase Order validation', () => {
	it('should not return any errors for a correct PO', () => {
		expect(validatePurchaseOrder('AB12345')).toEqual([])
	})

	it('should only return errors.po-empty', () => {
		expect(validatePurchaseOrder('')).toEqual(['errors.po-empty'])
	})

	it('should only return errors.po-too-short', () => {
		expect(validatePurchaseOrder('1')).toEqual(['errors.po-too-short'])
	})

	it('should return errors.po-special-characters AND errors.po-too-long', () => {
		expect(
			validatePurchaseOrder(':this,is#an:invalidPOthatsWayTooLong')
		).toEqual(['errors.po-too-long', 'errors.po-special-characters'])
	})
})
