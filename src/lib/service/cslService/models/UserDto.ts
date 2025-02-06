export class UserDto {
	constructor(
		public learnerEmail: string,
		public learnerName: string,
		public professionId: number,
		public professionName: string,
		public departmentHierarchy: {id: number; code: string; name: string}[],
		public gradeId?: number,
		public gradeName?: string,
		public lineManagerName?: string,
		public lineManagerEmail?: string
	) {}
}
