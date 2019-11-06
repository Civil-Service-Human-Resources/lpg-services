import {Request, Response} from 'express'
import {MAINTENANCE} from 'lib/config'
import * as template from '../../lib/ui/template'

export function maintenancePage(request: Request, response: Response) {

response.send(template.render('maintenance', request, response, {
		maintenanceWindow: MAINTENANCE.maintenanceWindowMessage,
	}))
}
