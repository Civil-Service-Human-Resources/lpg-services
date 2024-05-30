export class UserDto {
	constructor(
		public gradeId?: number,
		public learnerEmail: string,
		public learnerName: string,
		public organisationId: number,
		public professionId: number,
		public userDepartmentHierarchy: string[ ]) {}
}
