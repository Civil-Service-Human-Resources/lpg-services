import {Transform} from 'class-transformer'
import {transformNsgUrl} from '../categories/category'

export class TagOverview {
	public id: number
	@Transform(transformNsgUrl)
	public urlSlug: string
	public name: string
}
