import * as helper from 'extension/helper'
import * as puppeteer from 'puppeteer'
import {selectors, returnXpathStr} from 'page/learningPlan'
import {loginToCsl} from 'page/login'
import {createUser, deleteUser, getUser, updateUser} from 'extension/user'
import {wrappedBeforeAll, wrappedAfterAll} from 'extension/testsetup'
import * as config from 'test/config'

function genUserEmail() {
	return `test${Date.now()}@c.gov.uk`
}

let TEST_USERNAME = genUserEmail()

describe('profile page functionality', () => {
	let page: puppeteer.Page

	wrappedBeforeAll(async () => {
		const session = await helper.getSession('learning plan')
		page = await session.newPage()
		await page.authenticate({
			username: config.BASIC_AUTH_USERNAME,
			password: config.BASIC_AUTH_PASSWORD,
		})
		await page.goto(config.URL)
		const userId = await createUser(TEST_USERNAME, config.TEST_PASSWORD)
		await updateUser(userId, TEST_USERNAME, 'Test', 'CO', 'HR', 'G7')
		await loginToCsl(page, config.USERNAME, config.PASSWORD)
		await page.waitFor(selectors.signoutButton)
	})

	wrappedAfterAll(async () => {
		const userInfo = await getUser(TEST_USERNAME)
		await deleteUser(userInfo.id)
		await page.close()
	})

	it('Should display the required learning section', async () => {
		expect(
			await helper.checkElementIsPresent(selectors.requiredLearingSection, page)
		).toBe(true)
	})

	it('Should display the learning plan section', async () => {
		expect(
			await helper.checkElementIsPresent(selectors.learningPlanSection, page)
		).toBe(true)
	})

	it('Should display the suggested learning section', async () => {
		expect(
			await helper.checkElementIsPresent(selectors.suggestedSection, page)
		).toBe(true)
	})

	it('Should display a suggested learning button within the heading section', async () => {
		expect(
			await helper.checkElementIsPresent(selectors.suggestedButton, page)
		).toBe(true)
	})

	it('Should display required learning courses with the status of not started', async () => {
		const statuses = await returnXpathStr(
			page,
			selectors.requiredLearningCourseProgress
		)
		for (const status of statuses) {
			expect(status).toEqual('Not started')
		}
	})

	it('Should list course name and further details on the course', async () => {
		const courseName = await returnXpathStr(
			page,
			selectors.requiredLearningCourseProgress
		)
		for (const course of courseName) {
			await page.click(course)
			const overviewTitle = await helper.returnElementAttribute(
				selectors.courseOverviewTitle,
				'innerHTML',
				page
			)
			expect(course).toEqual(overviewTitle)
			page.goBack()
		}
	})

	it('Should display course type for all listed courses', async () => {
		const courseType = await returnXpathStr(
			page,
			selectors.requiredLearningCourseType
		)
		for (const types of courseType) {
			expect(types).toBeTruthy()
		}
	})

	it('Should display course duration for all listed courses', async () => {
		const courseDuration = await returnXpathStr(
			page,
			selectors.requiredLearningCourseDuration
		)
		for (const duration of courseDuration) {
			expect(duration).toBeTruthy()
		}
	})
})
