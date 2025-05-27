import { badRequestResponse } from "./responses.js";

export const isPayloadValid = (validationSchema, errorCallback = () => { }) => {
    return async (req, res, next) => {
        const validationResult = validationSchema.validate({ ...req.body }, { abortEarly: false })
        if (validationResult.error) {
            errorCallback(req, res, next)
            const formattedErrors = validationResult.error.details.reduce((acc, error) => {
                acc[error.path[0] || error?.context?.missing?.[0] || 'path'] = error.message.replace(/"/g, '');
                return acc;
            }, {});
            return badRequestResponse(res, { message: formattedErrors })
        } else {
            next()
        }
    }
}