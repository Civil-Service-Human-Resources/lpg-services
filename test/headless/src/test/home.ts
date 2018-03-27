import * as config from 'extension/config'
import * as helper from 'extension/helper'
import {wrappedAfterAll, wrappedBeforeAll} from 'extension/testsetup'
import {createUser, deleteUser, getUser, updateUser} from 'extension/user'
import {returnXpathStr, selectors} from 'page/home'
import {loginToCsl} from 'page/login'
import * as puppeteer from 'puppeteer'

function genUserEmail() {
	return `test${Date.now()}@c.gov.uk`
}

const TEST_USERNAME = genUserEmail()

describe('learning page functionality', () => {
	let page: puppeteer.Page

	wrappedBeforeAll(async () => {
		const session = await helper.getSession('learning plan')
		page = await session.newPage()
		await page.authenticate({
			password: config.BASIC_AUTH_PASSWORD,
			username: config.BASIC_AUTH_USERNAME,
		})
		await page.goto(config.URL)
		const userId = await createUser(TEST_USERNAME, config.TEST_PASSWORD)
		await updateUser(userId, TEST_USERNAME, 'Test', 'co', 'commercial', 'G6')
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
			await helper.checkElementIsPresent(selectors.requiredSection, page)
		).toBe(true)
	})

	it('Should display the other learning section', async () => {
		expect(
			await helper.checkElementIsPresent(selectors.otherSection, page)
		).toBe(true)
	})

	it('Should display the suggested learning section', async () => {
		expect(
			await helper.checkElementIsPresent(selectors.suggestedSection, page)
		).toBe(true)
	})

	it('Should display grid for suggested learning courses', async () => {
		expect(
			await helper.checkElementIsPresent(selectors.suggestedGrid, page)
		).toBe(true)
	})

	xit('Should display required learning courses with the status of not started', async () => {
		const statuses = await returnXpathStr(
			page,
			selectors.requiredLearningCourseProgress
		)
		for (const status of statuses) {
			expect(status).toEqual('Not started')
		}
	})

	xit('Should list course name and further details on the course', async () => {
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

	xit('Should display course type for all listed courses', async () => {
		const courseType = await returnXpathStr(
			page,
			selectors.requiredLearningCourseType
		)
		for (const types of courseType) {
			expect(types).toBeTruthy()
		}
	})

	xit('Should display course duration for all listed courses', async () => {
		const courseDuration = await returnXpathStr(
			page,
			selectors.requiredLearningCourseDuration
		)
		for (const duration of courseDuration) {
			expect(duration).toBeTruthy()
		}
	})
})
