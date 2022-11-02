import {createClient} from 'redis'
import {promisify} from 'util'

export abstract class Cache<T> {
	constructor(private readonly redisClient: ReturnType<typeof createClient>) {}

	async get(id: string | number): Promise<T | undefined> {
		const response = await promisify(this.redisClient.get)(this.getFormattedKey(id))
		if (response === null) {
			return undefined
		}
		return this.convert(response)
	}

	async getList(): Promise<T[] | undefined> {
		const response = await promisify(this.redisClient.get)(this.getListKey())
		if (response == null) {
			return undefined
		}
		const jsonResponse: any[] = JSON.parse(response)
		return this.convertList(jsonResponse)
	}

	protected getListKey() {
		return this.getFormattedKey('list')
	}

	protected abstract getFormattedKey(keyPart: string | number): string
	protected abstract convert(cacheHit: string): T
	protected abstract convertList(cachedList: any[]): T[]
}
