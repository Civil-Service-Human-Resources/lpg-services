import {Transform} from 'class-transformer'
import {NSG_ROUTER_BASE} from '../../../../../config'

export class Category {
	public title: string
	public description: string
	@Transform(({value}) => {
		return `${NSG_ROUTER_BASE}/categories/${value}`
	})
	public url: string
}
