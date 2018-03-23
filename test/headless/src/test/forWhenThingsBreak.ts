import * as config from 'extension/config'
import * as helper from 'extension/helper'
import {wrappedAfterAll, wrappedBeforeAll} from 'extension/testsetup'
import {loginToCsl} from 'page/login'
import {editProfileInfo, selectors} from 'page/profile'
import * as puppeteer from 'puppeteer'

describe('profile page functionality', () => {
	let page: puppeteer.Page

	wrappedBeforeAll(async () => {
		const session = await helper.getSession('update profile')
		page = await session.newPage()
		await page.authenticate({
			password: config.BASIC_AUTH_PASSWORD,
			username: config.BASIC_AUTH_USERNAME,
		})
		await page.goto(config.URL)
		await loginToCsl(page, 'test@lpg.dev.cshr.digital', '1337h4x0r')
		await page.waitFor(selectors.signoutButton)
		await page.goto(config.BASE_URL + '/profile')
	})

	wrappedAfterAll(async () => {
		await page.close()
	})

	it('Should be able to update users name from the profile section', async () => {
		const name = 'John'
		await editProfileInfo(
			selectors.changeGivenName,
			selectors.editNameField,
			name,
			page
		)
		expect(
			await helper.checkElementIsPresent(selectors.profileUpdatedBanner, page)
		).toBe(true)
		const updatedName = await helper.getText(selectors.givenName, page)
		expect(updatedName).toEqual(name)
	})
})
