import * as config from '../extension/config'
import {
	createUser,
	deleteUser,
	getUser,
	updateUser,
	updateUserGroups,
} from '../extension/user'
import {genUserEmail} from '../page/globals'
import {selectors} from '../page/home'
import loginPage from '../page/login'

const TEST_USERNAME = genUserEmail()

describe('Home page funtionality', () => {
	beforeAll(async () => {
		browser.url(config.URL)
		const userId = await createUser(TEST_USERNAME, config.TEST_PASSWORD)
		await updateUser(userId, TEST_USERNAME, 'Test', 'co', 'commercial', 'G6')
		await updateUserGroups(TEST_USERNAME, userId)
	})

	afterAll(async () => {
		const userInfo = await getUser(TEST_USERNAME)
		await deleteUser(userInfo.id)
	})

	it('Should display the required learning section', () => {
		loginPage.login(TEST_USERNAME, config.TEST_PASSWORD)
		browser.waitForVisible(selectors.signoutButton)
		expect(browser.isVisible(selectors.requiredSection)).toBe(true)
	})

	it('Should display the other learning section', () => {
		expect(browser.isVisible(selectors.otherSection)).toBe(true)
	})

	it('Should display mandatory learning on first login', () => {
		const learnCount = browser.elements(selectors.courseName).value.length
		expect(learnCount).toBeGreaterThanOrEqual(3)
	})
})
