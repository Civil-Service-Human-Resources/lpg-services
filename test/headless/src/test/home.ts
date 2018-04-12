import * as config from 'extension/config'
import * as helper from 'extension/helper'
import {wrappedAfterAll, wrappedBeforeAll} from 'extension/testsetup'
import {
	createUser,
	deleteUser,
	getUser,
	updateUser,
	updateUserGroups,
} from 'extension/user'
import {interactSuggested, selectors} from 'page/home'
import {loginToCsl} from 'page/login'
import * as puppeteer from 'puppeteer'

function genUserEmail() {
	return `test${Date.now()}@c.gov.uk`
}

const TEST_USERNAME = genUserEmail()

describe('home page functionality', () => {
	let page: puppeteer.Page

	wrappedBeforeAll(async () => {
		const session = await helper.getSession('learning plan')
		page = await session.newPage()
		if (config.PROFILE !== 'local') {
			await page.authenticate({
				password: config.BASIC_AUTH_PASSWORD,
				username: config.BASIC_AUTH_USERNAME,
			})
		}
		await page.goto(config.URL)
		const userId = await createUser(TEST_USERNAME, config.TEST_PASSWORD)
		await updateUser(userId, TEST_USERNAME, 'Test', 'co', 'commercial', 'G6')
		await updateUserGroups(TEST_USERNAME, userId)
		await loginToCsl(page, config.USERNAME, config.TEST_PASSWORD)
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

	it('Should display suggested for you tiles with links to courses', async () => {
		expect(await helper.checkElementIsPresent(selectors.tileTitle, page)).toBe(
			true
		)
		expect(
			await helper.returnElementAttribute(selectors.tileTitle, 'href', page)
		).toContain('/courses')
	})

	it('Should display suggested for you tiles with remove from learning plan option', async () => {
		expect(await helper.checkElementIsPresent(selectors.tileRemove, page)).toBe(
			true
		)
	})

	it('Should display suggested for you tiles with add to learning plan option', async () => {
		expect(await helper.checkElementIsPresent(selectors.tileAdd, page)).toBe(
			true
		)
	})

	it('Should add material to learning plan from suggested tiles and display notification', async () => {
		const added = await interactSuggested(
			selectors.tileTitle,
			selectors.tileAdd,
			page
		)
		await page.waitForSelector(selectors.bannerConfirmation)
		const notif = await helper.getText(selectors.bannerConfirmation, page)
		const otherSection = await helper.getText(
			selectors.otherSectionCourse,
			page
		)
		expect(notif).toEqual(added)
		expect(otherSection).toEqual(added)
	})

	it('Should remove material to learning plan from suggested tiles', async () => {
		const removed = await interactSuggested(
			selectors.tileTitle,
			selectors.tileAdd,
			page
		)
		const allSug = await helper.getAllText(selectors.tileTitle, page)
		for (const sug of allSug) {
			expect(sug).not.toBe(removed)
		}
	})

	it('Should list course name and further details on the course', async () => {
		await page.goto(config.BASE_URL)
		const courseName = await helper.getText(selectors.courseName, page)
		await page.click(selectors.courseLink)
		await page.waitForSelector(selectors.courseInfoTitle)
		const coursePage = await helper.getText(selectors.courseInfoTitle, page)
		expect(coursePage).toEqual(courseName)
	})

	it('Should display course type for all listed courses', async () => {
		const courseTypes = await helper.getAllText(selectors.courseType, page)
		for (const types of courseTypes) {
			expect(types).toBeTruthy()
		}
	})

	it('Should display course duration for all listed courses', async () => {
		const courseDuration = await helper.getAllText(
			selectors.courseDuration,
			page
		)
		for (const duration of courseDuration) {
			expect(duration).toBeTruthy()
		}
	})

	// xit('Should display required learning courses with the status of not started', async () => {})
})
