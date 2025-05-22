import {expect} from 'chai'
import * as learningRecordIndex from '../../../src/ui/controllers/learning-record/index'

describe('Learning record controller tests', () => {
	describe('learning-record page', () => {
		describe('Required learning message', () => {
			it('should return no required learning if required learning count is 0', () => {
				const message: string = learningRecordIndex.getRequiredLearningStatusMessage(0, 0)
				expect(message).to.eql('There is no required learning for your department.')
			})

			it('should return no required learning completed if required learning count is 10 and completed required learning is 0', () => {
				const message: string = learningRecordIndex.getRequiredLearningStatusMessage(0, 10)
				expect(message).to.eql("You haven't completed any of your required courses.")
			})

			it('should return not all required learning completed if required learning count is 10 and completed required learning is 5', () => {
				const message: string = learningRecordIndex.getRequiredLearningStatusMessage(5, 10)
				expect(message).to.eql("You haven't completed all of your required learning for this reporting year.")
			})

			it('should return all required learning completed if required learning count is 10 and completed required learning is 10', () => {
				const message: string = learningRecordIndex.getRequiredLearningStatusMessage(10, 10)
				expect(message).to.eql('You have completed all of your required learning for this reporting year.')
			})
		})
	})
})
