import * as Cookies from 'cookies'
import * as express from 'express'
import { MAINTENANCE } from "lib/config/index"

export async function processMaintenance(
	req: express.Request,
	res: express.Response,
	next: express.NextFunction) {
		const MAINTENANCE_URL = "/maintenance"
		const cookies = new Cookies(req, res)
		const overrideCookie = cookies.get(MAINTENANCE.overrideTokenName)

		if (shouldRedirectToMaintenancePage(req.url, overrideCookie, MAINTENANCE_URL, MAINTENANCE)) {
			res.redirect(MAINTENANCE_URL)
			return
		}

		if (shouldRedirectToMainPage(req.url, MAINTENANCE_URL, MAINTENANCE)) {
			res.redirect("/")
			return
		}

		next()
}

export function shouldRedirectToMaintenancePage(
	reqUrl: string,
	maintenanceOverrideCookie: string | undefined,
	maintenanceUrl: string,
	maintenanceConfig: any) {
	return maintenanceConfig.enabled &&
		!isMaintenanceRequest(reqUrl, maintenanceUrl) &&
		!isWhiteListedRequest(reqUrl) &&
		!isMaintenanceOverrideCookiePresent(maintenanceOverrideCookie, maintenanceConfig)
}

export function shouldRedirectToMainPage(
	reqUrl: string,
	maintenanceUrl: string,
	maintenanceConfig: any): boolean {
	return !maintenanceConfig.enabled && isMaintenanceRequest(reqUrl, maintenanceUrl)
}

export function isMaintenanceRequest(reqUrl: string, maintenanceUrl: string): boolean {
	return reqUrl === maintenanceUrl
}

export function isWhiteListedRequest(reqUrl: string): boolean  {
	const ASSETS_PATH = "/assets"
	const AUTHENTICATE_PATH = "/authenticate"

	return reqUrl.startsWith(ASSETS_PATH) ||
			reqUrl.startsWith(AUTHENTICATE_PATH)
}

export function isMaintenanceOverrideCookiePresent(
	maintenanceOverrideCookie: string | undefined,
	config: any): boolean {
	return maintenanceOverrideCookie === config.overrideTokenValue
}
