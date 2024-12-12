import {KeyValue} from 'lib/utils/dataUtils'

export class SortableList<T extends KeyValue> {

	constructor(protected list: T[]) { }

	public getList(): T[] {
		return this.list
	}

	public sort(): void {
		this.list = this.list.sort(this.getCompareFn())
	}

	public fetchWithIds(ids: string[]): T[] {
		return this.list.filter(obj => ids.includes(obj.getId()))
	}

	public fetchOne(id: string): T {
		return this.fetchWithIds([id])[0]
	}

	protected getCompareFn() {
		return (a: any, b: any) => {
			if (a.name === "I don't know") {
				return 1
			}
			if (b.name === "I don't know") {
				return -1
			}
			if (a.name < b.name) {
				return -1
			}
			if (a.name > b.name) {
				return 1
			}
			return 0
		}
	}

}
