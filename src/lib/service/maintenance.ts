import * as Cookies from 'cookies'
import * as express from 'express'
import { MAINTENANCE } from "lib/config/index"

const MAINTENANCE_URL = "/maintenance"
const ASSETS_PATH = "/assets"

export async function processMaintenance(
	req: express.Request,
	res: express.Response,
	next: express.NextFunction) {
		const cookies = new Cookies( req, res)
		if (shouldRedirectToMaintenancePage(req, cookies)) {
			res.redirect(MAINTENANCE_URL)
			return
		}

		if (shouldRedirectToMainPage(req)) {
			res.redirect("/")
			return
		}
		next()
}

function shouldRedirectToMaintenancePage(req: express.Request, cookies: Cookies) {
	return MAINTENANCE.enabled &&
		!isMaintenaceRequest(req) &&
		!isAssetsRequest(req) &&
		!isMaintenanceOverrideCookiePresent(req, cookies)
}

function shouldRedirectToMainPage(req: express.Request): boolean {
	return !MAINTENANCE.enabled && isMaintenaceRequest(req)
}

function isMaintenaceRequest(req: express.Request): boolean {
	return req.url === MAINTENANCE_URL
}

function isAssetsRequest(req: express.Request): boolean  {
	return req.url.startsWith(ASSETS_PATH)
}

function isMaintenanceOverrideCookiePresent(req: express.Request, cookies: Cookies): boolean {
	return cookies.get(MAINTENANCE.overrideTokenName) === MAINTENANCE.overrideTokenValue
}
