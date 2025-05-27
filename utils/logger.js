import { createLogger, transports, format } from "winston"

const output = process.env.NODE_ENV

const formatter = format.printf(
    ({ level, message, label, timestamp }) =>
        `${timestamp} [${level}]: [${label}]:${message}`
)

const options = {
    error: {
        level: "error",
        format: format.combine(format.timestamp(), formatter),
        filename: `${process.cwd()}/logs/${output}/combined.log`,
        handleException: true,
        json: true,
        maxSize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false
    },
    info: {
        level: "info",
        format: format.combine(format.timestamp(), formatter),
        filename: `${process.cwd()}/logs/${output}/combined.log`,
        handleException: false,
        json: true,
        maxSize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false
    },
    console: {
        format: format.combine(
            format.colorize(),
            format.timestamp(),
            format.align(),
            formatter
        ),
        level: "debug",
        handleExceptions: true,
        json: false,
        colorize: true
    }
}

const logger = createLogger({
    level: "info",
    transports: [
        new transports.File(options.error),
        new transports.File(options.info),
        new transports.Console(options.console)
    ],
    exitOnError: false
})

logger.stream = {
    /**
     * Message form incoming request
     *
     * @param {string} message
     */
    write(message) {
        logger.info(message.trim())
    }
}

export const stream = logger.stream
export default logger

