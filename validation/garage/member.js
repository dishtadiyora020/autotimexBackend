import Joi from "joi"
import mongoose from "mongoose"

export const addNewMemberSchema = Joi.object({
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    email: Joi.string().email().required(),
    roles: Joi.array().items(Joi.string().custom((value, helper) => {
        return !mongoose.Types.ObjectId.isValid(value) ? helper.error('string.object_id', { value }) : true
    }).messages({
        'string.object_id': 'Invalid {#label} id',
    })).required(),
    phone: Joi.string().required()
})

export const updateMemberSchema = Joi.object({
    first_name: Joi.string(),
    last_name: Joi.string(),
    email: Joi.string().email(),
    roles: Joi.array().items(Joi.string().custom((value, helper) => {
        return !mongoose.Types.ObjectId.isValid(value) ? helper.error('string.object_id', { value }) : true
    }).messages({
        'string.object_id': 'Invalid {#label} id',
    })),
    phone: Joi.string()
})