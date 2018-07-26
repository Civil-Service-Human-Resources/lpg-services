import {expect} from 'chai'
import {validate} from './booking'

describe('Payment validation', () => {
	describe('of type PURCHASE_ORDER', () => {
		const validatePO = (value: string) => validate('PURCHASE_ORDER', value)

		it('should not return any errors for a correct PO', () => {
			expect(validatePO('AB12345')).to.eql([])
		})

		it('should only return errors.po-empty', () => {
			expect(validatePO('')).to.eql(['errors.po-empty'])
		})

		it('should only return errors.po-too-short', () => {
			expect(validatePO('1')).to.eql(['errors.po-too-short'])
		})

		it('should return errors.po-special-characters AND errors.po-too-long', () => {
			expect(validatePO(':this,is#an:invalidPOthatsWayTooLong')).to.eql([
				'errors.po-too-long',
				'errors.po-special-characters',
			])
		})
	})

	describe('of type FINANCIAL_APPROVER', () => {
		const validateFAP = (value: string) => validate('FINANCIAL_APPROVER', value)

		it('should not return any errors for a correct value', () => {
			expect(validateFAP('learner@domain.com')).to.eql([])
		})

		it('should return error for incorrect value', () => {
			expect(validateFAP('domain.com')).to.eql(['errors.invalid-email-address'])
		})
	})
})
