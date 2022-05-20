import {ModuleRecordInput} from '../../moduleRecord/models/moduleRecordInput'

export class CourseRecordInput {
	constructor(
		readonly courseId: string,
		readonly courseTitle: string,
		readonly userId: string,
		readonly isRequired: boolean,
		readonly moduleRecords: ModuleRecordInput[],
		readonly state?: string,
		readonly preference?: string
	) {}
}
