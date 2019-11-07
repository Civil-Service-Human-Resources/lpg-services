import {expect} from 'chai'
import * as maintenanceService from './maintenance'

describe('Maintenance page service', () => {
	describe('When maintenance mode is on', () => {
		const maintenanceConfig = {
			enabled: true,
			overrideTokenValue: 'token_value',
		}
		describe('When override cookie is not present', () => {
			describe('When request is not whitelisted', () => {
				describe('When request is not /maintenance already', () => {
					it('should redirect to /maintenance page', () => {
						expect(
							maintenanceService.shouldRedirectToMaintenancePage(
								"/nope", "cookie", "/maintenance", maintenanceConfig)).to.equal(true)
					})
					it('should not redirect to / page', () => {
						expect(
							maintenanceService.shouldRedirectToMainPage(
								"/nope", "/maintenance", maintenanceConfig)).to.equal(false)
					})
				})
				describe('When request is /maintenance already', () => {
					it('should not redirect to /maintenance page', () => {
						expect(
							maintenanceService.shouldRedirectToMaintenancePage(
								"/maintenance", "cookie", "/maintenance", maintenanceConfig)).to.equal(false)
					})
					it('should not redirect to / page', () => {
						expect(
							maintenanceService.shouldRedirectToMainPage(
								"/maintenance", "/maintenance", maintenanceConfig)).to.equal(false)
					})
				})
			})
			describe('When request is whitelisted', () => {
				it('should not redirect to /maintenance page', () => {
					expect(
						maintenanceService.shouldRedirectToMaintenancePage(
							"/authenticate/resolve", "cookie", "/maintenance", maintenanceConfig)).to.equal(false)
				})
				it('should not redirect to / page', () => {
					expect(
						maintenanceService.shouldRedirectToMainPage(
							"/authenticate/resolve", "/maintenance", maintenanceConfig)).to.equal(false)
				})
			})
		})

		describe('When override cookie is present', () => {
			describe('When request is not whitelisted', () => {
				describe('When request is not /maintenance already', () => {
					it('should not redirect to /maintenance page', () => {
						expect(
							maintenanceService.shouldRedirectToMaintenancePage(
								"/nope", maintenanceConfig.overrideTokenValue, "/maintenance", maintenanceConfig)).to.equal(false)
					})
					it('should not redirect to / page', () => {
						expect(
							maintenanceService.shouldRedirectToMainPage(
								"/nope", "/maintenance", maintenanceConfig)).to.equal(false)
					})
				})

				describe('When request is /maintenance already', () => {
					it('should not redirect to /maintenance page', () => {
						expect(
							maintenanceService.shouldRedirectToMaintenancePage(
								"/maintenance", maintenanceConfig.overrideTokenValue, "/maintenance", maintenanceConfig)).to.equal(false)
					})
					it('should not redirect to / page', () => {
						expect(
							maintenanceService.shouldRedirectToMainPage(
								"/maintenance", "/maintenance", maintenanceConfig)).to.equal(false)
					})
				})
			})
		})
	})

	describe('When maintenance mode is off', () => {
		const maintenanceConfig = {
			enabled: false,
			overrideTokenValue: 'token_value',
		}
		describe('When override cookie is not present', () => {
			describe('When request is not whitelisted', () => {
				describe('When request is not /maintenance already', () => {
					it('should not redirect to /maintenance page', () => {
						expect(
							maintenanceService.shouldRedirectToMaintenancePage(
								"/nope", "cookie", "/maintenance", maintenanceConfig)).to.equal(false)
					})
					it('should not redirect to / page', () => {
						expect(
							maintenanceService.shouldRedirectToMainPage(
								"/nope", "/maintenance", maintenanceConfig)).to.equal(false)
					})
				})
				describe('When request is /maintenance already', () => {
					it('should not redirect to /maintenance page', () => {
						expect(
							maintenanceService.shouldRedirectToMaintenancePage(
								"/maintenance", "cookie", "/maintenance", maintenanceConfig)).to.equal(false)
					})

					it('should redirect to / page', () => {
						expect(
							maintenanceService.shouldRedirectToMainPage(
								"/maintenance", "/maintenance", maintenanceConfig)).to.equal(true)
					})
				})
			})
			describe('When request is whitelisted', () => {
				it('should not redirect to /maintenance page', () => {
					expect(
						maintenanceService.shouldRedirectToMaintenancePage(
							"/authenticate/resolve", "cookie", "/maintenance", maintenanceConfig)).to.equal(false)
				})

				it('should not redirect to / page', () => {
					expect(
						maintenanceService.shouldRedirectToMainPage(
							"/authenticate/resolve", "/maintenance", maintenanceConfig)).to.equal(false)
				})
			})
		})

		describe('When override cookie is present', () => {
			describe('When request is not whitelisted', () => {
				describe('When request is not /maintenance already', () => {
					it('should not redirect to /maintenance page', () => {
						expect(
							maintenanceService.shouldRedirectToMaintenancePage(
								"/nope", maintenanceConfig.overrideTokenValue, "/maintenance", maintenanceConfig)).to.equal(false)
					})

					it('should not redirect to / page', () => {
						expect(
							maintenanceService.shouldRedirectToMainPage(
								"/nope", "/maintenance", maintenanceConfig)).to.equal(false)
					})
				})

				describe('When request is /maintenance already', () => {
					it('should not redirect to /maintenance page', () => {
						expect(
							maintenanceService.shouldRedirectToMaintenancePage(
								"/maintenance", maintenanceConfig.overrideTokenValue, "/maintenance", maintenanceConfig)).to.equal(false)
					})

					it('should redirect to / page', () => {
						expect(
							maintenanceService.shouldRedirectToMainPage(
								"/maintenance", "/maintenance", maintenanceConfig)).to.equal(true)
					})
				})
			})
		})
	})

	const config = {
		enabled: false,
		overrideTokenValue: 'expected',
	}

	it('should return false on non-whitelisted url check', () => {
		expect(maintenanceService.isWhiteListedRequest("/nope")).to.equal(false)
	})

	it('should return true on non-whitelisted url check', () => {
		expect(maintenanceService.isWhiteListedRequest("/authenticate/resolve")).to.equal(true)
	})

	it('should return false on maintanance cookie check when wrong or not present cookie', () => {
		expect(maintenanceService.isMaintenanceOverrideCookiePresent(undefined, config)).to.equal(false)
		expect(maintenanceService.isMaintenanceOverrideCookiePresent("wrong", config)).to.equal(false)
	})

	it('should return true on maintanance cookie check when correct present cookie', () => {
		expect(maintenanceService.isMaintenanceOverrideCookiePresent("expected", config)).to.equal(true)
	})

	it('should return false on non maintenance request check if valid request provided', () => {
		expect(maintenanceService.isMaintenanceRequest('/test', '/maintenance')).to.equal(false)
	})

	it('should return true on maintenance request check if valid request provided', () => {
		expect(maintenanceService.isMaintenanceRequest('/maintenance', '/maintenance')).to.equal(true)
	})
})
