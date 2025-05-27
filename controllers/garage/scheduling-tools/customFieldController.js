import { badRequestResponse, internalServerErrorResponse, notFoundResponse, successResponse } from "../../../middleware/responses.js";
import GARAGE from "../../../models/garage.js";
import Logger from "../../../middleware/logger.js";
const logger = new Logger("garage/scheduling-tools/customFieldController.js");
import Custom_Field from "../../../models/scheduling-tools/customField.js";


const createCustomField = async (req, res) => {
    try {
        logger.log("[CREATE CUSTOM FIELD] API Called");

        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);
        if (!garage) {
            return badRequestResponse(res, {
                message: "Garage not found"
            });
        }
        const value = req.body;

        // Find existing field
        const existingField = await Custom_Field.findOne({ garage_id: _id, custom_type: value.custom_type });

        if (existingField) {
            // Update existing custom fields
            const updatedCustomFields = [...existingField.custom_fields];

            // Merge new custom fields into existing ones
            value.custom_fields.forEach(newField => {
                const existingIndex = updatedCustomFields.findIndex(field => field.field_name === newField.field_name);
                if (existingIndex > -1) {
                    // If field already exists, update it
                    updatedCustomFields[existingIndex] = { ...updatedCustomFields[existingIndex], ...newField };
                } else {
                    // If it's a new field, add it to the array
                    updatedCustomFields.push(newField);
                }
            });

            // Update the document with merged custom fields
            existingField.custom_fields = updatedCustomFields;
            await existingField.save();
        } else {
            // Create new custom field entry if it doesn't exist
            await Custom_Field.create({
                garage_id: _id,
                ...value,
            });
        }

        return successResponse(res, {
            message: 'Custom field created successfully'
        });

    } catch (error) {
        logger.error(`[CREATE CUSTOM FIELD ERROR] ${error.message}`, { error });

        return internalServerErrorResponse(res, {
            message: 'Failed to create custom field',
            error: error.message,
        });
    }
};

const getCustomFields = async (req, res) => {
    try {
        logger.log("[GET CUSTOM FIELDS] API Called");
        const { _id } = req.user;
        const { custom_type } = req.query;

        // Validate that custom_type is provided
        if (!custom_type) {
            return badRequestResponse(res, {
                message: "custom_type is required"
            });
        }
        // Find records based on garage_id and custom_type
        const customFields = await Custom_Field.find({
            garage_id: _id,
            custom_type: custom_type
        });

        // Check if any records are found
        if (!customFields || customFields.length === 0) {
            return notFoundResponse(res, {
                message: `No custom fields found for custom_type: ${custom_type}`
            });
        }

        return successResponse(res, {
            message: "Custom fields retrieved successfully",
            data: customFields
        });
    } catch (error) {
        logger.error(`[GET CUSTOM FIELDS ERROR] ${error.message}`, { error });

        return internalServerErrorResponse(res, {
            message: "Failed to retrieve custom fields",
            error: error.message,
        });
    }
};

const getCustomerCustomFields = async (req, res) => {
    try {
        logger.log("[GET CUSTOM FIELDS] API Called");
        const { _id } = req.user;

        // Find records based on garage_id and custom_type
        const customFields = await Custom_Field.find({
            garage_id: _id,
            custom_type: "CUSTOMER"
        });

        // Check if any records are found
        if (!customFields || customFields.length === 0) {
            return notFoundResponse(res, {
                message: `No custom fields found for custom_type: ${custom_type}`
            });
        }

        return successResponse(res, {
            message: "Custom fields retrieved successfully",
            data: customFields
        });
    } catch (error) {
        logger.error(`[GET CUSTOM FIELDS ERROR] ${error.message}`, { error });

        return internalServerErrorResponse(res, {
            message: "Failed to retrieve custom fields",
            error: error.message,
        });
    }
};
const getAppointmentCustomFields = async (req, res) => {
    try {
        logger.log("[GET CUSTOM FIELDS] API Called");
        const { _id } = req.user;

        // Find records based on garage_id and custom_type
        const customFields = await Custom_Field.find({
            garage_id: _id,
            custom_type: "APPOINTMENT_DEDICATED"
        });

        // Check if any records are found
        if (!customFields || customFields.length === 0) {
            return notFoundResponse(res, {
                message: `No custom fields found for custom_type: ${custom_type}`
            });
        }

        return successResponse(res, {
            message: "Custom fields retrieved successfully",
            data: customFields
        });
    } catch (error) {
        logger.error(`[GET CUSTOM FIELDS ERROR] ${error.message}`, { error });

        return internalServerErrorResponse(res, {
            message: "Failed to retrieve custom fields",
            error: error.message,
        });
    }
};
const getVehicleCustomFields = async (req, res) => {
    try {
        logger.log("[GET CUSTOM FIELDS] API Called");
        const { _id } = req.user;

        // Find records based on garage_id and custom_type
        const customFields = await Custom_Field.find({
            garage_id: _id,
            custom_type: "VEHICLE"
        });

        // Check if any records are found
        if (!customFields || customFields.length === 0) {
            return notFoundResponse(res, {
                message: `No custom fields found for custom_type: ${custom_type}`
            });
        }

        return successResponse(res, {
            message: "Custom fields retrieved successfully",
            data: customFields
        });
    } catch (error) {
        logger.error(`[GET CUSTOM FIELDS ERROR] ${error.message}`, { error });

        return internalServerErrorResponse(res, {
            message: "Failed to retrieve custom fields",
            error: error.message,
        });
    }
};

const updateCustomFieldObject = async (req, res) => {
    try {
        logger.log("[UPDATE CUSTOM FIELD OBJECT] API Called");

        const { _id } = req.user;
        const { custom_type, field_id, update_data } = req.body;

        // Validate that custom_type and field_id are provided
        if (!custom_type || !field_id) {
            return badRequestResponse(res, {
                message: "custom_type and field_id are required"
            });
        }

        // Find the document based on garage_id and custom_type
        const existingField = await Custom_Field.findOne({ garage_id: _id, custom_type });

        if (!existingField) {
            return notFoundResponse(res, {
                message: `No custom field found for custom_type: ${custom_type}`
            });
        }

        // Find the specific object in the custom_fields array using its _id
        const fieldIndex = existingField.custom_fields.findIndex(field => field._id.toString() === field_id);

        if (fieldIndex === -1) {
            return notFoundResponse(res, {
                message: `No custom field object found with _id: ${field_id}`
            });
        }

        // Remove the existing object from the array
        existingField.custom_fields.splice(fieldIndex, 1);

        // Add the new object to the array with the same field_id
        existingField.custom_fields.push({
            ...update_data,
            _id: field_id
        });

        // Save the updated document
        await existingField.save();

        return successResponse(res, {
            message: "Custom field object updated successfully",
            data: existingField.custom_fields // Return updated fields
        });

    } catch (error) {
        logger.error(`[UPDATE CUSTOM FIELD OBJECT ERROR] ${error.message}`, { error });

        return internalServerErrorResponse(res, {
            message: "Failed to update custom field object",
            error: error.message,
        });
    }
};

const deleteCustomFieldObject = async (req, res) => {
    try {
        logger.log("[DELETE CUSTOM FIELD OBJECT] API Called");

        const { _id } = req.user;
        const { custom_type, field_id } = req.body;
        if (!custom_type || !field_id) {
            return badRequestResponse(res, {
                message: "custom_type and field_id are required"
            });
        }

        // Find the document based on garage_id and custom_type
        const existingField = await Custom_Field.findOne({ garage_id: _id, custom_type });

        if (!existingField) {
            return notFoundResponse(res, {
                message: `No custom field found for custom_type: ${custom_type}`
            });
        }

        // Find the specific object in the custom_fields array using its _id
        const fieldIndex = existingField.custom_fields.findIndex(field => field._id.toString() === field_id);

        if (fieldIndex === -1) {
            return notFoundResponse(res, {
                message: `No custom field object found with _id: ${field_id}`
            });
        }

        // Remove the specific object from the array
        existingField.custom_fields.splice(fieldIndex, 1);

        // Save the updated document
        await existingField.save();

        return successResponse(res, {
            message: "Custom field object deleted successfully",
        });

    } catch (error) {
        logger.error(`[DELETE CUSTOM FIELD OBJECT ERROR] ${error.message}`, { error });

        return internalServerErrorResponse(res, {
            message: "Failed to delete custom field object",
            error: error.message,
        });
    }
};

const getCustomFieldObjectById = async (req, res) => {
    try {
        logger.log("[GET CUSTOM FIELD OBJECT BY ID] API Called");

        const { _id } = req.user;
        const { custom_type, field_id } = req.query;

        // Validate that custom_type and field_id are provided
        if (!custom_type || !field_id) {
            return badRequestResponse(res, {
                message: "custom_type and field_id are required"
            });
        }
        // Find the document based on garage_id and custom_type
        const existingField = await Custom_Field.findOne({ garage_id: _id, custom_type });
        if (!existingField) {
            return notFoundResponse(res, {
                message: `No custom field found for custom_type: ${custom_type}`
            });
        }
        // Find the specific object in the custom_fields array using its _id
        const fieldObject = existingField.custom_fields.find(field => field._id.toString() === field_id);

        if (!fieldObject) {
            return notFoundResponse(res, {
                message: `No custom field object found with _id: ${field_id}`
            });
        }
        return successResponse(res, {
            message: "Custom field object retrieved successfully",
            data: fieldObject // Return the retrieved object
        });

    } catch (error) {
        logger.error(`[GET CUSTOM FIELD OBJECT BY ID ERROR] ${error.message}`, { error });

        return internalServerErrorResponse(res, {
            message: "Failed to retrieve custom field object",
            error: error.message,
        });
    }
};


const filterCustomFields = async (req, res) => {
    try {
        logger.log("[FILTER CUSTOM FIELDS] API Called");

        const { _id } = req.user;
        const { type } = req.query;

        // Validate that type is provided
        if (!type) {
            return badRequestResponse(res, {
                message: "type is required"
            });
        }

        // Validate that type is one of the allowed values or 'all'
        const validTypes = ['yes/no', 'text', 'number', 'select', 'multiselect', 'emailinput', 'date', 'all'];
        if (!validTypes.includes(type)) {
            return badRequestResponse(res, {
                message: "Invalid type value. Allowed values are: yes/no, text, number, select, multiselect, emailinput, date, or all."
            });
        }

        // Build the query
        const query = {
            garage_id: _id,
            custom_type: 'APPOINTMENT_ISSUE_TREE'
        };

        // If type is not 'all', add a filter for custom_fields.type
        let matchStage = { $match: query };
        if (type !== 'all') {
            matchStage.$match['custom_fields.type'] = type; // Filter by type in custom_fields
        }

        // Use aggregation to retrieve and filter data
        const customFields = await Custom_Field.aggregate([
            matchStage,
            {
                $project: {
                    _id: 1,
                    garage_id: 1,
                    custom_type: 1,
                    custom_fields: {
                        $filter: {
                            input: "$custom_fields",
                            as: "field",
                            cond: type === "all" ? {} : { $eq: ["$$field.type", type] }
                        }
                    }
                }
            }
        ]);

        // // Check if any records are found
        // if (!customFields || customFields.length === 0) {
        //     return notFoundResponse(res, {
        //         message: `No custom fields found for custom_type: APPOINTMENT_ISSUE_TREE with type: ${type}`
        //     });
        // }

        return successResponse(res, {
            message: "Custom fields retrieved successfully",
            data: customFields
        });

    } catch (error) {
        logger.error(`[FILTER CUSTOM FIELDS ERROR] ${error.message}`, { error });

        return internalServerErrorResponse(res, {
            message: "Failed to retrieve custom fields.",
            error: error.message,
        });
    }
};



export default { createCustomField, getCustomFields, updateCustomFieldObject, deleteCustomFieldObject, getCustomFieldObjectById, filterCustomFields , getCustomerCustomFields ,getAppointmentCustomFields ,getVehicleCustomFields }