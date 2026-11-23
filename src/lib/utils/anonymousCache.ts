import {ClassConstructor} from 'class-transformer'
import {createClient} from 'redis'
import {Logger} from 'winston'
import {getLogger} from '../logger'

import {SimpleCache} from './simpleCache'

export class AnonymousCache<T> {
	protected logger: Logger
	private simpleCache: SimpleCache

	constructor(
		redisClient: ReturnType<typeof createClient>,
		defaultTTL: number,
		private prefix: string,
		private readonly clazz: ClassConstructor<T>
	) {
		this.simpleCache = new SimpleCache(redisClient, defaultTTL)
		this.logger = getLogger('AnonymousCache')
	}

	async get(): Promise<T | undefined> {
		return await this.simpleCache.getWithId(this.prefix, this.clazz)
	}

	async set(object: T, ttlOverride?: number) {
		await this.simpleCache.setWithId(this.prefix, object, ttlOverride)
	}

	async delete() {
		await this.simpleCache.deleteWithId(this.prefix)
	}
}
