export class Course {
	readonly uid: string
	readonly type: string
	public title: string
	public tags: string[]
	public uri: string
	public shortDescription: string
	public description: string
	public learningOutcomes: string
	public duration: string

	constructor(uid: string, type: string) {
		this.uid = uid
		this.type = type
	}
}
