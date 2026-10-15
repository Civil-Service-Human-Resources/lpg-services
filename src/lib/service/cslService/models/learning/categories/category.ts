import {Transform, TransformFnParams, Type} from 'class-transformer'
import {NSG_FLAG} from '../../../../../config'
import {CategoryLink} from './categoryLink'

export const transformNsgUrl = (params: TransformFnParams) => {
	return `${NSG_FLAG ? '/home' : '/nsg-homepage'}/topics/${params.value}`
}

export class Category {
	public title: string
	public description: string
	@Transform(transformNsgUrl, {groups: ['api']})
	public url: string
	@Type(() => CategoryLink)
	public categories: CategoryLink[]
}
