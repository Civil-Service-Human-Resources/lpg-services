import * as config from 'lib/config'
import * as redis from 'redis'

export const redisClient = createRedisClient()

function createRedisClient() {
	return redis.createClient({
		auth_pass: config.REDIS.password,
		host: config.REDIS.host,
		no_ready_check: true,
		port: config.REDIS.port,
		prefix: config.REDIS.keyPrefix,
	})
}
