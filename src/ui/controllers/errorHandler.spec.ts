import * as cheerio from "cheerio"
import {NextFunction, Request, Response} from 'express'
import * as proxyquire from 'proxyquire'

const app = proxyquire('../server', {
	'serve-favicon': (path: string) => {
		return (req: Request, res: Response, next: NextFunction) => {
			throw new Error("Error thrown from mock")
		}
	},
})

import {assert, expect} from 'chai'
import * as request from 'supertest'

const errorIsDisplayed = (res: request.Response) => {
	const $ = cheerio.load(res.text)

	const stackElement: Cheerio | null = $("p#error-stack")
	const timeElement: Cheerio | null = $("p#error-time")

	if (stackElement) {
		expect(stackElement.text()).to.contain("Error thrown from mock")
	} else {
		assert.fail()
	}

	if (timeElement && timeElement.text()) {
		const errorTime: number = Date.parse(timeElement.text())

		expect(errorTime).to.be.lessThan(Date.now())
		expect(errorTime).to.be.greaterThan(Date.now() - 1000)

	} else {
		assert.fail()
	}

	return res
}

const errorIsHidden = (res: request.Response) => {
	const $ = cheerio.load(res.text)

	const errorElement: Cheerio | null = $('p#generic-error')
	const messageElement: Cheerio | null = $('p#error-message')

	if (errorElement) {
		expect(errorElement.text()).to.equal("Something went horribly wrong. But don't worry, we're looking into it.")
	} else {
		assert.fail("p#generic-error element is missing")
	}

	if (messageElement) {
		expect(messageElement.text()).to.equal("Please wait a few minutes and try again.")
	} else {
		assert.fail('p#try-again is missing')
	}
	return res
}

const runTest = (test: (res: request.Response) => request.Response, done: any) => {
	request(app)
		.get('/home')
		.accept("text/html")
		.expect(500)
		.expect(test)
		.end((err: any, res: any) => {
			if (err) {
				done(err)
			} else {
				done()
			}
		})
}

describe('Errors should be displayed differently depending on environment', () => {
	let env: any

	beforeEach(() => {
		env = process.env
	})

	afterEach(() => {
		process.env = env
	})

	it('should display the error stack and server time if environment is dev', done =>  {
		process.env = {
			ENV_PROFILE: 'dev',
		}

		runTest(errorIsDisplayed, done)
	})

	it('should display the error stack and server time if environment is test', done =>  {
		process.env = {
			ENV_PROFILE: 'test',
		}

		runTest(errorIsDisplayed, done)
	})

	it('should hide the error stack and server time if environment is prod', done =>  {
		process.env = {
			ENV_PROFILE: 'prod',
		}

		runTest(errorIsHidden, done)
	})

	it('should hide the error stack and server time if environment is not set', done =>  {

		runTest(errorIsHidden, done)
	})
})
