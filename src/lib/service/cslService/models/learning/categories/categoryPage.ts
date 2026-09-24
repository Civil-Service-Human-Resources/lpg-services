import {Expose, Transform, Type} from 'class-transformer'
import {CacheableObject} from '../../../../../utils/cacheableObject'
import {BasicCourse} from '../learningPlan/basicCourse'
import {BasicCourseResponse} from '../learningPlan/basicCourseResponse'
import {CategoryLink} from './categoryLink'
import {Category} from './category'
import {Hyperlink} from './hyperlink'
import {HyperlinkResponse} from './hyperlinkResponse'

export class CategoryPage implements CacheableObject {
	@Type(() => CategoryLink)
	parents: CategoryLink[]
	@Type(() => Category)
	categories: Category[]
	title: string
	url: string
	description: string
	courseCount: number
	@Type(() => BasicCourseResponse)
	courses: BasicCourseResponse

	linkCount: number
	@Type(() => HyperlinkResponse)
	links: HyperlinkResponse

	// Generated data
	@Expose()
	@Transform(({obj}) => {
		const contentResponse = obj.courses.results.length > 0 ? obj.courses : obj.links
		const rows = []
		for (let i = 0; i < contentResponse.results.length; i += 2) {
			const chunk = contentResponse.results.slice(i, i + 2)
			rows.push(chunk)
		}
		return rows
	})
	public rows: (BasicCourse[] | Hyperlink[])[]

	getContentResponse() {
		return this.courses.results.length > 0 ? this.courses : this.links
	}

	getDisplay() {
		return this.courses.results.length > 0 ? 'courses' : 'links'
	}

	hasContent() {
		return this.linkCount > 0 || this.courseCount > 0
	}

	isTier1(): boolean {
		return !this.parents || this.parents.length === 0
	}

	shouldShowCategoryCards(): boolean {
		if (!this.categories || this.categories.length === 0) {
			return false
		}
		if (this.isTier1()) {
			return true
		}
		return this.rows.length === 0
	}

	getId(): string {
		const contentResponse = this.courses.results.length > 0 ? this.courses : this.links
		const display = this.getDisplay()
		return `${this.url}:${display}:${contentResponse.page}`
	}
}
