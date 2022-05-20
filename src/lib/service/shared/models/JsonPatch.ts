export enum Ops {
	replace,
}

export class JsonPatch {
	op: Ops
	path: string
	value?: string

	constructor(op: Ops, path: string, value?: string) {
		this.op = op
		this.path = path.includes('/') ? `/${path}` : path
		this.value = value
	}
}
