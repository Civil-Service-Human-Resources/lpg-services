import {ClassConstructor, plainToInstance} from 'class-transformer'
import {createClient} from 'redis'
import {promisify} from 'util'
import {Logger} from 'winston'
import {getLogger} from '../logger'

export class SimpleCache {
	protected logger: Logger
	constructor(
		protected readonly redisClient: ReturnType<typeof createClient>,
		protected readonly defaultTTL: number
	) {
		this.logger = getLogger('simpleCache')
	}

	async getWithId<T>(id: string, clazz: ClassConstructor<T>): Promise<T | undefined> {
		try {
			const response = await promisify(this.redisClient.get).bind(this.redisClient)(id)
			if (response === null) {
				return undefined
			}
			return plainToInstance(clazz, JSON.parse(response))
		} catch (e) {
			this.logger.error(`Error getting object from cache with id ${id}. Error: ${e}`)
			return undefined
		}
	}

	async setWithId<T>(id: string, object: T, ttlOverride?: number) {
		try {
			await promisify(this.redisClient.setex).bind(this.redisClient)(
				id,
				ttlOverride ? ttlOverride : this.defaultTTL,
				JSON.stringify(object)
			)
		} catch (e) {
			this.logger.error(`Error setting object to cache with id ${id}.
			Object: ${JSON.stringify(object)} Error: ${e}.`)
			throw e
		}
	}

	async deleteWithId(id: string) {
		try {
			// redisClient.delete does not play nicely with promisify, so just
			// set expiriy = now
			await promisify(this.redisClient.expire).bind(this.redisClient)(id, 0)
		} catch (e) {
			this.logger.error(`Error deleting object from cache with key ${id}. Error: ${e}.`)
			throw e
		}
	}
}

export let simpleCache: SimpleCache

export const setSimpleCache = (simpleRedisCache: SimpleCache) => {
	simpleCache = simpleRedisCache
}
