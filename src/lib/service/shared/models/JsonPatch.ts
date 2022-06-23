export enum Ops {
	replace = 'replace',
	remove = 'remove',
}

export class JsonPatch {

	static replacePatch(path: string, value?: string) {
		return new this(Ops.replace, path, value)
	}

	static removePatch(path: string) {
		return new this(Ops.remove, path)
	}

	op: Ops
	path: string
	value?: string

	constructor(op: Ops, path: string, value?: string) {
		this.op = op
		this.path = !path.includes('/') ? `/${path}` : path
		this.value = value
	}

}
