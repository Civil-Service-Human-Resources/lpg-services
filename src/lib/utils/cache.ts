import { RedisClient } from 'redis'
import {promisify} from 'util'

export abstract class Cache <T> {
    constructor(private readonly redisClient: RedisClient) {}

    protected abstract convert(cacheHit: any): T
    protected abstract convertList(cachedList: string[]): T[]

    async get(key:string): Promise<T|undefined>{
        const response = await promisify(this.redisClient.hgetall)(key)
        if (response === undefined) {
            return undefined
        }
        return this.convert(response)
    }

    async getList(key:string): Promise<T[]|undefined> {
        const response = await promisify(this.redisClient.lrange)(key, 0, -1)
        if (response === undefined) {
            return undefined
        }
        return this.convertList(response)
    }
}