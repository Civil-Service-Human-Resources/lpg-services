import {Type} from 'class-transformer'
import {Link} from '../../../../../utils/ui/link'
import {Category} from './category'

export class CategoryPage {
	@Type(() => Link)
	parents: Link[]
	@Type(() => Category)
	categories: Category[]
	title: string
	description: string
}
