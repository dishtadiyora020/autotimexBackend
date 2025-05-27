import logger from "../utils/logger.js"

class Logger {
    constructor(label) {
        this.label = label
    }

    log(message) {
        return logger.info(message, { label: this.label })
    }

    error(message) {
        return logger.error(message, { label: this.label })
    }

    debug(message) {
        return logger.debug(message, { label: this.label })
    }

    warn(message) {
        return logger.warn(message, { label: this.label })
    }
}

export default Logger
