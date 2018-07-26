import * as express from 'express'
import * as reports from 'lib/reports'
import * as template from 'lib/ui/template'

export function index(req: express.Request, res: express.Response) {
	res.send(template.render('reports/index', req, res, {}))
}

export async function runLearnerRecordReport(
	req: express.Request,
	res: express.Response
) {
	const data = await reports.getLearnerRecordReport(req.user)
	res.attachment('report.csv')
	res.send(data)
}

export async function runBookingsReport(
	req: express.Request,
	res: express.Response
) {
	const data = await reports.getBookingsReport(req.user)
	res.attachment('bookings.csv')
	res.send(data)
}
