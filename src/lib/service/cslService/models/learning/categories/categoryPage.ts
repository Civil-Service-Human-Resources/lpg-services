import {Type} from 'class-transformer'
import {CategoryParent} from './categoryParent'
import {Category} from './category'

export class CategoryPage {
	@Type(() => CategoryParent)
	parents: CategoryParent[]
	@Type(() => Category)
	categories: Category[]
	title: string
	description: string
}
