import { badRequestResponse, internalServerErrorResponse, successResponse } from "../../../middleware/responses.js";
import CUSTOMER_TOOL from "../../../models/scheduling-tools/customerTool.js";
import CUSTOMER_INFO from "../../../models/scheduling-tools/customerInfo.js";
import GARAGE from "../../../models/garage.js";
import Logger from "../../../middleware/logger.js";
import { getPagination, sortingQuery } from "../../../utils/common.js";
import { cloneDeep } from "../../../lib/commonQueries.js";
const logger = new Logger("garage/scheduling-tools/customerInfoController.js")
const createCustomerTool = async (req, res) => {
    try {
        logger.log("[GET OR CREATE CUSTOMER TOOL] API Called");

        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);

        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        let customerTool = await CUSTOMER_TOOL.findOne({ garage_id: _id });
        const updateData = {
            is_collect_email: req.body.is_collect_email,
            is_require_email: req.body.is_require_email,
            is_ask_customer_address: req.body.is_ask_customer_address,
            is_verify_phone_new_customer: req.body.is_verify_phone_new_customer
        };

        if (customerTool) {
            customerTool = await CUSTOMER_TOOL.findOneAndUpdate(
                { garage_id: _id },
                updateData,
                { new: true }
            );
        } else {
            customerTool = new CUSTOMER_TOOL({
                garage_id: _id,
                ...updateData,
            });

            await customerTool.save();
        }

        return successResponse(res, {
            message: 'Customer tool fetched or created successfully',
            data: customerTool
        });
    } catch (error) {
        logger.error(`[GET OR CREATE CUSTOMER TOOL ERROR] ${error.message}`, { error: error.stack });
        return internalServerErrorResponse(res, {
            message: 'Failed to fetch or create customer tool',
            error: error.message
        });
    }
};

const getCustomerTool = async (req, res) => {
    try {
        logger.log("[GET CUSTOMER TOOL]  Api Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })

        let customerTool = await CUSTOMER_TOOL.findOne({ garage_id: _id });

        return successResponse(res, {
            message: "Customer Tool fetched successfully",
            payload: {
                customerTool
            },
        });
    } catch (error) {
        logger.error(error);
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
        });
    }
};

const addCustomerInfo = async (req, res) => {
    try {
        logger.log("[ADD CUSTOMER INFO] Api Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })
        const newCustomer = new CUSTOMER_INFO({
            garage_id: req.user._id,
            ...req.body,
        });
        // Save the new blocker to the database
        await newCustomer.save();
        return successResponse(res, { message: 'Customer info added successfully' });
    } catch (error) {
        return internalServerErrorResponse(res, { message: 'Failed to add Customer info', error: error.message });
    }
};

const getCustomerInfo = async (req, res) => {
    try {
        logger.log("[GET CUSTOMER INFO] API Called");
        const { _id } = req.user;

        // Find the garage by ID
        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });

        // Build filter based on request body
        const filter = {};
        const { first_name, phone, last_name, min_date, max_date, block_type } = req.body;

        if (first_name) {
            filter.first_name = { $regex: first_name, $options: 'i' };
        }
        if (last_name) {
            filter.last_name = { $regex: last_name, $options: 'i' };
        }
        if (phone) {
            filter.phone = { $regex: phone, $options: 'i' };
        }

        // Date filtering logic
        const dateFilter = {};
        if (min_date) dateFilter.$gte = new Date(min_date);
        if (max_date) dateFilter.$lte = new Date(max_date);

        // Combine filters
        Object.assign(filter, {
            garage_id: _id,
            ...(block_type && { block_type }),
            ...(Object.keys(dateFilter).length && { created_at: dateFilter })
        });

        // Aggregate customer data with pagination and sorting
        const customerData = await CUSTOMER_INFO.aggregate([
            {
                $facet: {
                    customer: [
                        { $match: filter },
                        { ...sortingQuery(req?.query?.sortBy, req?.query?.sortOrder) }, 
                        ...getPagination(req?.query?.page, req?.query?.limit), 
                        { $unset: ["garage_id"] }, 
                    ],
                    total: [
                        { $match: filter }, 
                        { $count: "total" }, 
                    ],
                },
            },
        ]);

        return successResponse(res, {
            message: "Customer info fetched successfully",
            payload: {
                customer: cloneDeep(customerData)?.[0]?.customer ?? [],
                total: cloneDeep(customerData)?.[0]?.total?.[0]?.total ?? 0,
            },
        });
    } catch (error) {
        logger.error(error);
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
            error: error.message || "Unknown error", // Log the error message for debugging
        });
    }
};


const deleteCustomerInfo = async (req, res) => {
    try {
        logger.log("[DELETE CUSTOMER INFO] API Called");
        const { _id } = req.user; // User ID from request
        const garage = await GARAGE.findById(_id); // Check if the garage exists

        if (!garage) return badRequestResponse(res, { message: "Garage not found" });

        const { customerId } = req.params; // Get customer ID from request parameters

        // Check if the customer exists
        const customer = await CUSTOMER_INFO.findOne({ _id: customerId, garage_id: _id });
        if (!customer) return badRequestResponse(res, { message: "Customer not found" });

        // Delete the customer info
        await CUSTOMER_INFO.deleteOne({ _id: customerId });

        return successResponse(res, { message: 'Customer info deleted successfully' });
    } catch (error) {
        logger.error(`[DELETE CUSTOMER INFO ERROR] ${error.message}`, { error: error.stack });
        return internalServerErrorResponse(res, {
            message: "Failed to delete customer info",
            error: error.message,
        });
    }
};

export default { createCustomerTool, getCustomerTool, addCustomerInfo, getCustomerInfo, deleteCustomerInfo }