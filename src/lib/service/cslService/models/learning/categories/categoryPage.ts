import {Type} from 'class-transformer'
import {Category} from './category'

export class CategoryPage {
	@Type(() => Category)
	categories: Category[]
}