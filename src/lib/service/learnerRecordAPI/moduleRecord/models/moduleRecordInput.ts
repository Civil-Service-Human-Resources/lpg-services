export class ModuleRecordInput {
	constructor(
		readonly userId: string,
		readonly courseId: string,
		readonly moduleId: string,
		readonly moduleTitle: string,
		readonly optional: boolean,
		readonly moduleType: string,
		readonly duration: number,
		readonly state?: string,
		readonly cost?: number,
		readonly eventId?: string,
		readonly eventDate?: Date
	) {}
}
