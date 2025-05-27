'use strict'

import { appendExtraParams } from "../lib/commonQueries.js";

export const successResponse = (res, extraParams = null) => {
    const response = { isSuccess: true, statusCode: 200 }
    appendExtraParams(response, extraParams)

    return res.status(200).json(response)
}

export const badRequestResponse = (res, extraParams = null) => {
    const response = { isSuccess: false, statusCode: 400 }
    appendExtraParams(response, extraParams)

    return res.status(400).json(response)
}

export const inValidRequestResponse = (res, extraParams = null) => {
    const response = { isSuccess: false, statusCode: 403 }
    appendExtraParams(response, extraParams)

    return res.status(403).json(response)
}

export const unauthorizedResponse = (res, extraParams = null) => {
    const resObject = { isSuccess: false, statusCode: 401 }
    appendExtraParams(resObject, extraParams)

    return res.status(401).json(resObject)
}

export const notFoundResponse = (res, extraParams = null) => {
    const response = { isSuccess: false, statusCode: 404 }
    appendExtraParams(response, extraParams)

    return res.status(404).json(response)
}

export const internalServerErrorResponse = (res, extraParams = null) => {
    const response = { isSuccess: false, statusCode: 500 }
    appendExtraParams(response, extraParams)

    return res.status(500).json(response)
}
