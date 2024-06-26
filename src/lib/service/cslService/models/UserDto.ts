export class UserDto {
	constructor(
		public learnerEmail: string,
		public learnerName: string,
		public organisationId: number,
		public organisationAbbreviation: string | undefined,
		public professionId: number,
		public professionName: string,
		public userDepartmentHierarchy: string[ ],
		public gradeId?: number,
		public gradeCode?: string) {}
}
