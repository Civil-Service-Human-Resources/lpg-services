import { createClient } from 'redis'
import { promisify } from 'util'
import { Logger } from 'winston'

import { getLogger } from '../logger'

export abstract class Cache<T> {
	private logger: Logger
	constructor(protected readonly redisClient: ReturnType<typeof createClient>, protected readonly defaultTTL: number) {
		this.logger = getLogger('Cache')
	}

	async get(id: string | number): Promise<T | undefined> {
		const key = this.getFormattedKey(id)
		try {
			const response = await promisify(this.redisClient.get).bind(this.redisClient)(key)
			if (response === null) {
				return undefined
			}
			return this.convert(JSON.parse(response))
		} catch (e) {
			this.logger.error(`Error getting object from cache with key ${key}. Error: ${e}`)
			return undefined
		}
	}

	async set(id: string | number, object: T, ttlOverride?: number) {
		const key = this.getFormattedKey(id)
		try {
			await promisify(this.redisClient.setex).bind(this.redisClient)(
				key,
				ttlOverride ? ttlOverride : this.defaultTTL,
				JSON.stringify(object)
			)
		} catch (e) {
			this.logger.error(`Error setting object to cache with key ${key}. Object: ${JSON.stringify(object)} Error: ${e}.`)
			throw e
		}
	}

	async delete(id: string | number) {
		const key = this.getFormattedKey(id)
		try {
			// redisClient.delete does not play nicely with promisify, so just
			// set expiriy = now
			await promisify(this.redisClient.expire).bind(this.redisClient)(key, 0)
		} catch (e) {
			this.logger.error(`Error deleting object from cache with key ${key}. Error: ${e}.`)
			throw e
		}
	}

	protected getFormattedKey(keyPart: string | number) {
		return `${this.getBaseKey()}:${keyPart}`
	}

	protected abstract getBaseKey(): string
	protected abstract convert(cacheHit: any): T
}
