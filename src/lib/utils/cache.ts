import {createClient} from 'redis'
import {promisify} from 'util'

export abstract class Cache<T> {
	constructor(
		protected readonly redisClient: ReturnType<typeof createClient>,
		protected readonly defaultTTL: number) {
	}

	async get(id: string|number): Promise<T | undefined> {
		const response = await promisify(this.redisClient.get).bind(this.redisClient)(this.getFormattedKey(id))
		if (response === null) {
			return undefined
		}
		return this.convert(JSON.parse(response))
	}

    async set(id: string|number, object: T, ttlOverride?: number) {
		await promisify(this.redisClient.setex).bind(this.redisClient)(
			this.getFormattedKey(id),
			ttlOverride ? ttlOverride : this.defaultTTL,
			JSON.stringify(object))
    }

	async delete(id: string|number) {
		// redisClient.delete does not play nicely with promisify, so just
		// set expiriy = now
		await promisify(this.redisClient.expire).bind(this.redisClient)(this.getFormattedKey(id), 0)
	}

	protected getFormattedKey(keyPart: string|number) {
		return `${this.getBaseKey()}:${keyPart}`
	}

	protected abstract getBaseKey(): string
	protected abstract convert(cacheHit: any): T
}
