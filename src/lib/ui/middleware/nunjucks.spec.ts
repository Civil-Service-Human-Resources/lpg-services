import {expect} from 'chai'
import * as express from 'express'
import * as nunjucks from 'nunjucks'
import {FEEDBACK_URL} from '../../config'
import * as nunjucksMiddleware from './nunjucks'

describe('Nunjucks middleware tests', () => {
	let app: express.Express

	beforeEach(() => {
		app = express()
		nunjucksMiddleware.register(app)
	})

	it('should register feedbackRoot global correctly in nunjucks environment', () => {
		const rendered = nunjucks.renderString('{{ feedbackRoot }}', {})
		expect(rendered).to.equal(FEEDBACK_URL)
	})

	it('should render header.njk phase banner with populated feedbackRoot URL', () => {
		const rendered = nunjucks.render('root/header.njk', {
			signedInUser: {
				hasCompleteProfile: () => false,
				isAdmin: () => false,
				isReporter: () => false,
			},
		})
		expect(rendered).to.include(`href="${FEEDBACK_URL}"`)
		expect(rendered).to.not.include('href="{{ feedbackRoot }}"')
	})

	it('should render header-nsg.njk phase banner with populated feedbackRoot URL', () => {
		const rendered = nunjucks.render('root/header-nsg.njk', {
			signedInUser: {
				hasCompleteProfile: () => false,
				isAdmin: () => false,
				isReporter: () => false,
			},
		})
		expect(rendered).to.include(`href="${FEEDBACK_URL}"`)
		expect(rendered).to.not.include('href="{{ feedbackRoot }}"')
	})
})
