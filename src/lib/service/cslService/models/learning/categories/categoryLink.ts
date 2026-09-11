import {Expose, Transform} from 'class-transformer'
import {NSG_FLAG} from '../../../../../config'

export class CategoryLink {
	text: string
	link: string

	@Expose({name: 'href'})
	@Transform(({obj}) => {
		return `${NSG_FLAG ? '/home' : '/nsg-homepage'}/topics/${obj.link}`
	})
	href: string
}
