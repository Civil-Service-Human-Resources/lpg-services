import {Expose, Transform, Type} from 'class-transformer'
import {BasicCourse} from '../learningPlan/basicCourse'
import {BasicCourseResponse} from '../learningPlan/basicCourseResponse'
import {CategoryLink} from './categoryLink'
import {Category} from './category'
import {Hyperlink} from './hyperlink'
import {HyperlinkResponse} from './hyperlinkResponse'

export class CategoryPage {
	@Type(() => CategoryLink)
	@Transform(({value}) => {
		return (value as CategoryLink[]).reverse()
	})
	parents: CategoryLink[]
	@Type(() => Category)
	categories: Category[]
	title: string
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
}
