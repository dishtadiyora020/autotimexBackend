'use strict';

import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';

const createQueryCondition = (key, value, fieldType) => {
    if (value === null || value === undefined) return null;

    switch (fieldType.toLowerCase()) {
        case 'number':
            const num = Number(value);
            if (isNaN(num)) return null;
            return { [key]: num };
        case 'string':
            const normalizedString = String(value).toLowerCase().trim();
            return { [key]: { $regex: new RegExp(`^${normalizedString}$`, 'i') } };
        default:
            return { [key]: value };
    }
};

export const checkDuplicateRecord = async (SCHEMA, id, keyValues, session) => {
    try {
        const query = {};

        if (id) {
            if (!ObjectId.isValid(id)) {
                throw new Error(`Invalid ObjectId: ${id}`);
            }
            query._id = { $ne: new ObjectId(id) };
        }

        if (Array.isArray(keyValues) && keyValues.length > 0) {
            const orConditions = keyValues
                .map(({ key, value, type }) => createQueryCondition(key, value, type))
                .filter(Boolean);

            if (orConditions.length > 0) {
                query.$or = orConditions;
            }
        }

        return await SCHEMA.findOne(query, null, ...(session ? [{ session }] : []))
    } catch (error) {
        console.error('Check duplicate record error:', error);
        throw error;
    }
};

export const appendExtraParams = (response, extraParams = null) => {
    if (extraParams) Object.keys(extraParams).map((item) => (response[item] = extraParams[item]));
};

export const cloneDeep = (array) => {
    if (array) return JSON.parse(JSON.stringify(array));
    return array;
};

export const removeFile = (file) => {
    if (file) {
        const filePath = path.join('public/uploads', file);
        fs.unlink(filePath, (error) => {
            if (error) {
                console.error(`Error deleting file: ${filePath}`, error);
            }
        });
    }
};