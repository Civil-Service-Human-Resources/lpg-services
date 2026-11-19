import {expect} from 'chai'
import * as asyncHandler from 'express-async-handler'
import * as sinon from 'sinon'
import {Readable} from 'stream'
import * as request from 'supertest'
import {client} from '../../../src/lib/service/cslService/baseConfig'
import {LearningRecordCache} from '../../../src/lib/service/cslService/cache/learningRecordCache'
import {setCaches} from '../../../src/lib/service/cslService/cslServiceClient'
import * as learningRecordIndex from '../../../src/ui/controllers/learning-record/index'
import {assertTables, TableAssertion} from '../../utils/htmlAssertions/assertTable'
import {getApp} from '../../utils/testApp'

const getLearningPlanTableAssertion = (
	courseDetails: {title: string; type: string; duration: string; completionDate: string}[]
): TableAssertion => {
	return {
		heading: ['Course title', 'Type', 'Duration', 'Date completed'],
		rows: [...courseDetails.map(cd => [cd.title, cd.type, cd.duration, cd.completionDate])],
	}
}

describe('Learning record controller tests', () => {
	const sandbox = sinon.createSandbox()
	const app = getApp()
	app.get('/learning-record', asyncHandler(learningRecordIndex.display))
	app.get('/learning-record/download', asyncHandler(learningRecordIndex.downloadReport))

	let cslServiceClientStub: sinon.SinonStubbedInstance<typeof client>
	let learningRecordCacheStub: sinon.SinonStubbedInstance<LearningRecordCache>

	beforeEach(() => {
		cslServiceClientStub = sandbox.stub(client)
		learningRecordCacheStub = sandbox.stub(new LearningRecordCache({} as any, 0))
	})
	afterEach(() => {
		sandbox.restore()
	})
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
				expect(message).to.eql("You haven't completed all of your required learning in this learning period.")
			})

			it('should return all required learning completed if required learning count is 10 and completed required learning is 10', () => {
				const message: string = learningRecordIndex.getRequiredLearningStatusMessage(10, 10)
				expect(message).to.eql('You have completed all of your required learning in this learning period.')
			})
		})

		describe('Render page tests', () => {
			it('Should render the page correctly', async () => {
				learningRecordCacheStub.get.resolves(undefined)
				setCaches(learningRecordCacheStub as any, {} as any, {} as any)
				cslServiceClientStub._get.resolves({
					requiredLearningRecord: {
						completedCourses: [
							{
								id: 'course1',
								title: 'Course 1',
								type: 'blended',
								duration: 7200,
								completionDate: '2025-03-01',
							},
						],
						totalRequired: 3,
					},
					otherLearning: [
						{
							id: 'course2',
							title: 'Course 2',
							type: 'unknown',
							duration: null,
							completionDate: '2025-01-01',
						},
					],
				})

				const res = await request(app).get('/learning-record').set({roles: 'LEARNER'})
				expect(res.status).eql(200)
				const assertions = [
					getLearningPlanTableAssertion([
						{title: 'Course 1', type: 'Blended', duration: '2 hours', completionDate: '01 Mar 2025'},
					]),
					getLearningPlanTableAssertion([
						{title: 'Course 2', type: 'unknown', duration: '-', completionDate: '01 Jan 2025'},
					]),
				]
				assertTables(res.text, assertions)
				expect(res.text).to.contain(
					'<p class="no-margin">You have <a href="/home">2 required courses</a> to complete.</p>'
				)
				expect(res.text).to.contain('<a class="button" href="/learning-record/download">Download learning record</a>')
			})
		})

		describe('Download report tests', () => {
			it('Should download the report zip successfully using Content-Disposition header from upstream service', async () => {
				const mockStream = new Readable({
					read() {
						this.push('mock zip file content')
						this.push(null)
					},
				})
				cslServiceClientStub.makeRequestResponse.resolves({
					data: mockStream,
					headers: {
						'content-disposition': 'attachment; filename="learner_record_2026-11-18_14-43-26.zip"',
						'content-type': 'application/zip',
					},
					status: 200,
					statusText: 'OK',
					config: {},
				} as any)

				const res = await request(app).get('/learning-record/download').set({roles: 'LEARNER'})
				expect(res.status).eql(200)
				expect(res.headers['content-type']).to.include('application/zip')
				expect(res.headers['content-disposition']).to.eql(
					'attachment; filename="learner_record_2026-11-18_14-43-26.zip"'
				)
				expect(res.text).to.eql('mock zip file content')
				expect(cslServiceClientStub.makeRequestResponse.calledOnce).to.eql(true)
				expect(cslServiceClientStub.makeRequestResponse.firstCall.args[0]).to.deep.eql({
					method: 'GET',
					responseType: 'stream',
					url: '/learning/record/download',
				})
			})

			it('Should fallback to default filename with timestamp when Content-Disposition is not present', async () => {
				sandbox.useFakeTimers(new Date('2026-11-18 16:00:00'))
				const mockStream = new Readable({
					read() {
						this.push('mock zip file content')
						this.push(null)
					},
				})
				cslServiceClientStub.makeRequestResponse.resolves({
					data: mockStream,
					headers: {},
					status: 200,
					statusText: 'OK',
					config: {},
				} as any)

				const res = await request(app).get('/learning-record/download').set({roles: 'LEARNER'})
				expect(res.status).eql(200)
				expect(res.headers['content-disposition']).to.eql(
					'attachment; filename="learning-record_2026-11-18_16-00-00.zip"'
				)
			})

			it('Should return 500 status when download fails', async () => {
				cslServiceClientStub.makeRequestResponse.rejects(new Error('Network error'))

				const res = await request(app).get('/learning-record/download').set({roles: 'LEARNER'})
				expect(res.status).eql(500)
			})
		})
	})
})
