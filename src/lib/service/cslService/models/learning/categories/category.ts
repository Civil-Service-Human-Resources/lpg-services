import {Transform, Type} from 'class-transformer'
import {NSG_FLAG} from '../../../../../config'
import {CategoryLink} from './categoryLink'

export class Category {
	public title: string
	public description: string
	@Transform(
		({value}) => {
			return `${NSG_FLAG ? '/home' : '/nsg-homepage'}/topics/${value}`
		},
		{
			groups: ['api'],
		}
	)
	public url: string
	@Type(() => CategoryLink)
	public categories: CategoryLink[] = []

	public courseCount?: number
	public linkCount?: number
	public totalCourses?: number
	public totalLinks?: number
	public totalContent?: number
	public hasDirectContent?: boolean

	public getHasDirectContent(): boolean {
		if (this.hasDirectContent !== undefined) {
			return this.hasDirectContent
		}
		if (this.courseCount !== undefined && this.courseCount > 0) {
			return true
		}
		if (this.linkCount !== undefined && this.linkCount > 0) {
			return true
		}
		if (this.totalCourses !== undefined && this.totalCourses > 0) {
			return true
		}
		if (this.totalLinks !== undefined && this.totalLinks > 0) {
			return true
		}
		if (this.totalContent !== undefined && this.totalContent > 0) {
			return true
		}
		return false
	}
}
