import {Transform, Type} from 'class-transformer'
import {CategoryParent} from './categoryParent'
import {Category} from './category'

export class CategoryPage {
	@Type(() => CategoryParent)
	@Transform(({value}) => {
		return (value as CategoryParent[]).reverse()
	})
	parents: CategoryParent[]
	@Type(() => Category)
	categories: Category[]
	title: string
	description: string
}
