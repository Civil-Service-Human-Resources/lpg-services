import * as express from 'express'
import * as purchaseOrdersService from 'lib/purchase-orders'
import * as template from 'lib/ui/template'

export async function index(req: express.Request, res: express.Response) {

	const purchaseOrders = await purchaseOrdersService.listAll()

	res.send(template.render('purchase-orders/index', req, res, {
		purchaseOrders,
	}))
}

export async function displayEdit(req: express.Request, res: express.Response) {

	const id = req.params.purchaseOrderId
	let purchaseOrder = null

	if (id === 'new') {
		purchaseOrder = {}
	} else {
		purchaseOrder = await purchaseOrdersService.get(id)
	}

	res.send(template.render('purchase-orders/edit', req, res, {
		purchaseOrder,
	}))
}

export async function doEdit(req: express.Request, res: express.Response) {
	const po = req.body

	if (!po.id || po.id === 'new') {
		delete po.id
	}

	const modules = po.modules as string

	if (modules) {
		po.modules = modules.split(',')
			.map(m => m.trim())
			.filter(m => !!m)
	} else {
		delete po.modules
	}

	await purchaseOrdersService.save(po)

	res.redirect('/purchase-orders')
}
