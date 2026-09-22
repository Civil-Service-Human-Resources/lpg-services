import {Transform, Type} from 'class-transformer'
import {NSG_FLAG} from '../../../../../config'
import {CategoryLink} from './categoryLink'

export class Category {
	public title: string
	public description: string
	@Transform(({value}) => {
		return `${NSG_FLAG ? '/home' : '/nsg-homepage'}/topics/${value}`
	})
	public url: string
	@Type(() => CategoryLink)
	public categories: CategoryLink[]
}
