import { format, transports, createLogger } from 'winston' 
import { AzureApplicationInsightsLogger } from 'winston-azure-application-insights'
const { combine, timestamp, printf } = format
import * as config from './config'

const loggingFormat = printf(info => JSON.stringify({
	timestamp: info.timestamp,
	level: info.level,
	message: info.message,
	name: info.name
}))

const WINSTON_CONFIG = {
	level: config.LOGGING_LEVEL,
	format: combine(
		timestamp(),
		loggingFormat
	),
	transports: [
		new AzureApplicationInsightsLogger({key: config.INSTRUMENTATION_KEY}),
		new transports.Console()
	]
}

const logger = createLogger(WINSTON_CONFIG)

export const getLogger = (loggerName: string) => {
	return logger.child({name: loggerName})
} 