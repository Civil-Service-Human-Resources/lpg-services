import {Expose, Transform} from 'class-transformer'
import * as CONFIG from '../../../../../config'

export class CategoryParent {
	text: string
	link: string

	@Expose({name: "href"})
	@Transform(({obj}) => {
		return `${CONFIG.LPG_UI_SERVER}/nsg-homepage/categories/${obj.link}`
	})
	href: string
}