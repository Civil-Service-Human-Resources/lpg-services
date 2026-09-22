import {plainToInstance} from 'class-transformer'
import {CacheableObjectCache} from '../../../utils/cacheableObjectCache'
import {CategoryPage} from '../models/learning/categories/categoryPage'

export class LearningCategoryCache extends CacheableObjectCache<CategoryPage> {
	protected convert(cacheHit: any): CategoryPage {
		return plainToInstance(CategoryPage, cacheHit)
	}

	protected getBaseKey(): string {
		return 'categoryPage'
	}

}