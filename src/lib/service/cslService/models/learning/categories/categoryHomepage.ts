import {Type} from 'class-transformer'
import {Category} from './category'

export class CategoryHomepage {
	@Type(() => Category)
	categories: Category[]
}
