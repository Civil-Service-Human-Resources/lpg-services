import {Expose, Transform} from 'class-transformer'
import {NSG_ROUTER_BASE} from '../../../../../config'

export class CategoryParent {
	text: string
	link: string

	@Expose({name: "href"})
	@Transform(({obj}) => {
		return `${NSG_ROUTER_BASE}/categories/${obj.link}`
	})
	href: string
}