import {ClassConstructor, plainToInstance} from 'class-transformer'
import {createClient} from 'redis'
import {promisify} from 'util'
import {Logger} from 'winston'

import {getLogger} from '../logger'

export class AnonymousCache<T> {
	protected logger: Logger

	constructor(
		protected readonly redisClient: ReturnType<typeof createClient>,
		protected readonly defaultTTL: number,
		private readonly prefix: string,
		private readonly clazz: ClassConstructor<T>
	) {
		this.logger = getLogger('Cache')
	}

	async get(): Promise<T | undefined> {
		try {
			const response = await promisify(this.redisClient.get).bind(this.redisClient)(this.prefix)
			if (response === null) {
				return undefined
			}
			return plainToInstance(this.clazz, JSON.parse(response))
		} catch (e) {
			this.logger.error(`Error getting object from cache with key ${this.prefix}. Error: ${e}`)
			return undefined
		}
	}

	async set(object: T, ttlOverride?: number) {
		try {
			await promisify(this.redisClient.setex).bind(this.redisClient)(
				this.prefix,
				ttlOverride ? ttlOverride : this.defaultTTL,
				JSON.stringify(object)
			)
		} catch (e) {
			this.logger.error(`Error setting object to cache with key ${this.prefix}.
			Object: ${JSON.stringify(object)} Error: ${e}.`)
			throw e
		}
	}

	async delete() {
		try {
			// redisClient.delete does not play nicely with promisify, so just
			// set expiriy = now
			await promisify(this.redisClient.expire).bind(this.redisClient)(this.prefix, 0)
		} catch (e) {
			this.logger.error(`Error deleting object from cache with key ${this.prefix}. Error: ${e}.`)
			throw e
		}
	}
}
