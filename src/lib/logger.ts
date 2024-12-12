import {createLogger, format, Logger, transports} from 'winston'
const {combine, timestamp, printf} = format
import * as config from './config'
const loggingFormat = printf(info =>
	JSON.stringify({
		timestamp: info.timestamp,
		level: info.level,
		message: info.message,
		name: info.name,
	})
)

const WINSTON_CONFIG = {
	format: combine(timestamp(), loggingFormat),
	level: config.LOGGING_LEVEL.toLowerCase(),
	transports: [new transports.Console()],
}

const winstonLogger: Logger = createLogger(WINSTON_CONFIG)

export const getLogger: Logger['child'] = (loggerName: string) => {
	return winstonLogger.child({name: loggerName})
}
