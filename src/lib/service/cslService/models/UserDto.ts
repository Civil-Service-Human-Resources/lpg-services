export class UserDto {
	constructor(
		public learnerEmail: string,
		public learnerName: string,
		public organisationId: number,
		public professionId: number,
		public userDepartmentHierarchy: string[ ],
		public gradeId?: number) {}
}
