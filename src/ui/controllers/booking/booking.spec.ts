import {validate} from './booking'

describe('Payment validation', () => {

	describe('of type PURCHASE_ORDER', () => {

		const validatePO = (value: string) => validate('PURCHASE_ORDER', value)

		it('should not return any errors for a correct PO', () => {
			expect(validatePO('AB12345')).toEqual([])
		})

		it('should only return errors.po-empty', () => {
			expect(validatePO('')).toEqual(['errors.po-empty'])
		})

		it('should only return errors.po-too-short', () => {
			expect(validatePO('1')).toEqual(['errors.po-too-short'])
		})

		it('should return errors.po-special-characters AND errors.po-too-long', () => {
			expect(validatePO(':this,is#an:invalidPOthatsWayTooLong')
			).toEqual(['errors.po-too-long', 'errors.po-special-characters'])
		})
	})

	describe('of type FINANCIAL_APPROVER', () => {

		const validateFAP = (value: string) => validate('FINANCIAL_APPROVER', value)

		it('should not return any errors for a correct value', () => {
			expect(validateFAP('learner@domain.com')).toEqual([])
		})

		it('should return error for incorrect value', () => {
			expect(validateFAP('domain.com')).toEqual(['errors.invalid-email-address'])
		})
	})
})
