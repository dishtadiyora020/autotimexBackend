import {
  badRequestResponse,
  internalServerErrorResponse,
  successResponse,
} from "../../middleware/responses.js";
import mongoose from "mongoose";
import GARAGE from "../../models/garage.js";
import LEADS from "../../models/leads.js";
import EXIT_LEADS from "../../models/exitLead.js";
import USER from "../../models/user.js";
import VEHICLE from "../../models/vehicle.js";
import CUSTOM_FIELDS from "../../models/scheduling-tools/customField.js";
import ISSUE_TREE from "../../models/scheduling-tools/issueTree.js";
import CUSTOMER_INFO from "../../models/scheduling-tools/customerInfo.js";
import DROP_OFF_CAPACITY from "../../models/availability/dropOffCapacity.js";
import PICKUP_OPTION from "../../models/availability/pickupOption.js";
import WAITER_CAPACITY from "../../models/availability/waiterCapacity.js";
import CUSTOMER_EXCEPTIONS_FOR_PICKUP from "../../models/availability/customerExceptionsForPickup.js";
import DROPOFF_WAITING_WARNING from "../../models/scheduling-tools/dropoffWaiting.js";
import MISC_SETTINGS from "../../models/availability/miscSettings.js";
import CALENDAR_NOTE from "../../models/scheduling-tools/calendarNote.js";
import CAPACITY_BLOCKER from "../../models/availability/capacityBlockerModels.js";
import SERVICES from "../../models/availability/serviceModels.js";
import TRANSPORTATION_OPTIONS from "../../models/scheduling-tools/transportationOptions.js";
import MARKETING_LINK from "../../models/marketingLinks.js";
import GARAGE_SETTINGS from "../../models/garageSettings.js";
import { getClientIp } from "request-ip";
import { writeBufferToFile } from "../../middleware/fileUploadHandler.js";
import Logger from "../../middleware/logger.js";
import { cloneDeep } from "../../lib/commonQueries.js";
import { getPagination } from "../../utils/common.js";
const logger = new Logger("garage/leadsController.js");
import moment from "moment";
const addExitLead = async (req, res) => {
  try {
    logger.log("[ADD LEADS] API Called");
    const { _id } = req.user;
    const garage = await GARAGE.findById(_id);
    if (!garage)
      return badRequestResponse(res, { message: "Garage not found" });
    const ExitLead = new EXIT_LEADS({
      garage_id: _id,
      ...req.body,
    });
    await ExitLead.save();
    return successResponse(res, {
      message: "Exit Lead added successfully",
    });
  } catch (error) {
    logger.error(`[ADD EXIT LEAD ERROR] ${error.message}`, {
      error: error.stack,
      user: req.user?._id,
    });
    return internalServerErrorResponse(res, {
      message: "Failed to add Exit Lead",
    });
  }
};

const getExitLead = async (req, res) => {
  try {
    logger.log("[GET MARKETING LINK] API Called");
    const { _id } = req.user;
    const garage = await GARAGE.findById(_id);
    if (!garage)
      return badRequestResponse(res, { message: "Garage not found" });
    const exitLead = await EXIT_LEADS.aggregate([
      {
        $facet: {
          exitLead: [
            { $match: { garage_id: _id } },
            ...getPagination(req?.query?.page, req?.query?.limit),
            { $unset: ["garage_id"] },
          ],
          total: [{ $match: { garage_id: _id } }, { $count: "total" }],
        },
      },
    ]);
    return successResponse(res, {
      message: "ExitLead fetched successfully",
      payload: {
        exitLead: cloneDeep(exitLead)?.[0]?.exitLead ?? [],
        total: cloneDeep(exitLead)?.[0]?.total?.[0]?.total ?? 0,
      },
    });
  } catch (error) {
    logger.error(`[GET ExitLead  ERROR] ${error.message}`, {
      error: error.stack,
      user: req.user?._id,
    });
    return internalServerErrorResponse(res, {
      message: "Something went wrong",
      error: error.message || "Unknown error",
    });
  }
};

const updateExitLead = async (req, res) => {
  try {
    logger.log("[ADD LEADS] API Called");
    const { _id } = req.user;
    const garage = await GARAGE.findById(_id);
    if (!garage)
      return badRequestResponse(res, { message: "Garage not found" });
    const { exitLeadID } = req.params;

    const updateData = req.body;

    const updateExitLead = await EXIT_LEADS.findOneAndUpdate(
      { _id: exitLeadID, garage_id: _id },
      { $set: updateData },
      { new: true }
    );

    if (!updateExitLead) {
      return badRequestResponse(res, { message: "exitLead not found" });
    }
    return successResponse(res, {
      message: "Exit Lead updated successfully",
    });
  } catch (error) {
    logger.error(`[UPDATE EXIT LEAD ERROR] ${error.message}`, {
      error: error.stack,
      user: req.user?._id,
    });
    return internalServerErrorResponse(res, {
      message: "Failed to update Exit Lead",
    });
  }
};

//leads

const createLead = async (req, res) => {
  try {
    logger.log("[ADD/UPDATE LEADS] API Called");
    const { _id: garageId } = req.user;
    const { code, leadID } = req.params;
    const userIp = getClientIp(req);
    const garage = await GARAGE.findById(garageId);
    let marketingLink;
    if (code) {
      marketingLink = await MARKETING_LINK.findOne({ code });
    }
    if (!garage)
      return badRequestResponse(res, { message: "Garage not found" });

    const {
      phone,
      issue_tree: rawIssueTree,
      service,
      customFieldValues,
      comments,
    } = req.body;

    let services = [];
    if (service) {
      try {
        services = JSON.parse(service);
      } catch {
        services = Array.isArray(service) ? service : [service];
      }
    }

    let commentsArray = [];
    if (comments) {
      try {
        commentsArray = JSON.parse(comments);
      } catch (err) {
        logger.error(`Failed to parse comments: ${err.message}`);
      }
    }

    let issue_tree = rawIssueTree ? JSON.parse(rawIssueTree) : [];

    const mediaUrls = [];
    if (req.files) {
      for (let file of req.files) {
        const match = file.fieldname.match(/^mediaFiles_(\d+)/);
        if (match) {
          const fileUrl = await writeBufferToFile(
            file.buffer,
            "leads",
            file.originalname
          );
          mediaUrls.push(fileUrl);
        }
      }
    }

    let user = null;
    let isNewCustomer = false;
    if (phone) {
      const isBlocked = await CUSTOMER_INFO.findOne({
        garage_id: garageId,
        phone,
      });
      if (isBlocked)
        return successResponse(res, { message: "Number is Blocked!" });

      user = await USER.findOne({ garage_id: garageId, phone });
      if (!user) {
        user = await new USER({ garage_id: garageId, phone }).save();
        isNewCustomer = true;
      }
    }

    let customFieldRawValues = {};
    try {
      customFieldRawValues =
        typeof customFieldValues === "string"
          ? JSON.parse(customFieldValues)
          : customFieldValues || {};
    } catch (err) {
      logger.error("Failed to parse customFieldValues:", err.message);
    }

    const customFieldDefs = await CUSTOM_FIELDS.find({
      custom_type: "APPOINTMENT_DEDICATED",
      garage_id: garageId,
    });
    const allCustomFields = customFieldDefs.flatMap(
      (doc) => doc.custom_fields || []
    );
    let dedicatedFieldValues = [];
    for (const field of allCustomFields) {
      const fieldId = field._id.toString();
      if (customFieldRawValues[fieldId] !== undefined) {
        dedicatedFieldValues.push({
          custom_field: field._id,
          value: customFieldRawValues[fieldId],
        });
      }
    }
    let lead;
    if (leadID) {
      lead = await LEADS.findById(leadID);
      if (!lead) {
        return badRequestResponse(res, { message: "Lead not found" });
      }
    } else {
      lead = new LEADS({ garage_id: garageId });
    }
    if (phone) {
      lead.user = user;
      lead.phone = phone;
      lead.is_new_customer = isNewCustomer;
    }
    lead.issue_tree = issue_tree;
    lead.service = services;
    lead.dedicated_field_values = dedicatedFieldValues;
    if (mediaUrls.length > 0) lead.media = mediaUrls;
    if (commentsArray.length > 0) lead.comments = commentsArray;
    if (marketingLink) {
      lead.marketing_data = {
        _id: marketingLink._id,
        source_tracking: marketingLink.source_tracking,
      };
    }
    await lead.save();
    if (marketingLink?.scan?.click && !leadID) {
      marketingLink.scan.lead.push({
        date: new Date(),
        ip: userIp,
        lead_id: lead._id,
      });
      await marketingLink.save();
    }
    return successResponse(res, {
      message: leadID ? "Lead updated successfully" : "Lead added successfully",
      lead,
      user,
    });
  } catch (error) {
    logger.error(`[ADD/UPDATE LEAD ERROR] ${error.message}`, {
      error: error.stack,
      user: req.user?._id,
    });
    return internalServerErrorResponse(res, {
      message: "Failed to add/update lead",
    });
  }
};

const updateLead = async (req, res) => {
  try {
    logger.log("[UPDATE LEAD] API Called");
    const { _id: garageId } = req.user;
    const { leadID } = req.params;
    const updateData = req.body;
    const garage = await GARAGE.findById(garageId);
    if (!garage)
      return badRequestResponse(res, { message: "Garage not found" });
    const lead = await LEADS.findOne({ _id: leadID, garage_id: garageId });
    if (!lead)
      return badRequestResponse(res, {
        message: "Lead not found or unauthorized",
      });
    let User;
    if (updateData.first_name || updateData.last_name) {
      User = await USER.findByIdAndUpdate(lead.user, {
        $set: {
          ...(updateData.first_name && { first_name: updateData.first_name }),
          ...(updateData.last_name && { last_name: updateData.last_name }),
          ...(updateData.email && { email: updateData.email }),
        },
      });
    }
    if (updateData.vehicle) {
      if (
        typeof updateData.vehicle === "string" ||
        updateData.vehicle.selectedVehicleId
      ) {
        const vehicleId =
          updateData.vehicle.selectedVehicleId || updateData.vehicle;
        const vehicleExists = await VEHICLE.findOne({
          _id: vehicleId,
          garage_id: garageId,
        });

        if (!vehicleExists) {
          throw new Error(
            "Vehicle not found or doesn't belong to this garage."
          );
        }
        updateData.vehicle = vehicleExists._id;
      } else {
        const vehicleData = { ...updateData.vehicle };
        const customFieldValues = [];
        const customFieldRawValues = vehicleData.customFieldValues || {};
        const customFieldDefs = await CUSTOM_FIELDS.find({
          custom_type: "VEHICLE",
          garage_id: garageId,
        });
        const allCustomFields = customFieldDefs.flatMap(
          (doc) => doc.custom_fields || []
        );
        for (const field of allCustomFields) {
          const fieldId = field._id.toString();
          if (customFieldRawValues[fieldId] !== undefined) {
            customFieldValues.push({
              custom_field: field._id,
              value: customFieldRawValues[fieldId],
            });
          }
        }
        let vehicle;
        if (lead.vehicle) {
          vehicle = await VEHICLE.findByIdAndUpdate(
            lead.vehicle,
            {
              $set: {
                ...vehicleData,
                custom_field_values: customFieldValues,
                garage_id: garageId,
              },
            },
            { new: true }
          );
        } else {
          const newVehicle = new VEHICLE({
            ...vehicleData,
            custom_field_values: customFieldValues,
            user_id: lead.user,
            garage_id: garageId,
          });
          vehicle = await newVehicle.save();
        }
        updateData.vehicle = vehicle._id;
      }
    }
    if (
      updateData.customerFieldValues &&
      Object.keys(updateData.customerFieldValues).length
    ) {
      const customerFieldValuesArray = Object.entries(
        updateData.customerFieldValues
      ).map(([key, value]) => ({
        custom_field: key,
        value,
      }));

      updateData.customer_field_values = customerFieldValuesArray;
    }
    const updatedLead = await LEADS.findByIdAndUpdate(
      leadID,
      { $set: updateData },
      { new: true }
    )
      .populate("vehicle")
      .populate("user");

    return successResponse(res, {
      message: "Lead updated successfully",
      lead: updatedLead,
      user: User,
    });
  } catch (error) {
    logger.error(`[UPDATE LEAD ERROR] ${error.message}`, {
      error: error.stack,
      user: req.user?._id,
    });

    return internalServerErrorResponse(res, {
      message: "Failed to update lead",
    });
  }
};

const getLead = async (req, res) => {
  try {
    logger.log("[GET LEAD] API Called");

    const { _id } = req.user;
    const garage = await GARAGE.findById(_id);
    if (!garage) {
      return badRequestResponse(res, { message: "Garage not found" });
    }

    const filter = req.query.filter || "any";
    const days = parseInt(req.query.days); // will be NaN if not provided

    const matchCondition = {
      garage_id: _id,
      status: "show",
      is_deleted: false,
      progress: { $nin: [null, "0%"] },
    };

    // Apply filter conditions
    switch (filter) {
      case "vehicle":
        matchCondition["vehicle"] = { $exists: true, $ne: null };
        break;
      case "dropoff":
        matchCondition["drop.pickup_type"] = { $exists: true, $ne: null };
        break;
      case "timeslot":
        matchCondition["drop.date"] = { $exists: true, $ne: null };
        matchCondition["drop.time"] = { $exists: true, $ne: null };
        break;
      case "any":
      default:
        break;
    }

    // Apply days-old filter if valid
    if (!isNaN(days) && days >= 0) {
      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - days);
      start.setHours(0, 0, 0, 0);

      const end = new Date(now);
      end.setDate(end.getDate() - days);
      end.setHours(23, 59, 59, 999);

      matchCondition["createdAt"] = { $gte: start, $lte: end };
    }

    const [customFieldsDef] = await CUSTOM_FIELDS.find({
      custom_type: "VEHICLE",
      garage_id: _id,
    });
    const customFieldsMap = {};
    for (const field of customFieldsDef?.custom_fields || []) {
      customFieldsMap[field._id.toString()] = field;
    }

    const exitLead = await LEADS.aggregate([
      {
        $match: matchCondition,
      },
      {
        $lookup: {
          from: "users",
          let: { userId: "$user" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$userId"] },
              },
            },
            {
              $project: {
                first_name: 1,
                last_name: 1,
                phone: 1,
              },
            },
          ],
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "vehicles",
          let: { vehicleId: "$vehicle" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$vehicleId"] },
              },
            },
          ],
          as: "vehicle",
        },
      },
      {
        $unwind: {
          path: "$vehicle",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $facet: {
          exitLead: [
            ...getPagination(req?.query?.page, req?.query?.limit),
            { $unset: ["garage_id"] },
          ],
          total: [{ $count: "total" }],
        },
      },
    ]);
    const result = exitLead[0] || {};
    const leads = result.exitLead || [];
    const issueTree = await ISSUE_TREE.findOne({ garage_id: _id }).lean();
    for (const lead of leads) {
      if (lead.vehicle && Array.isArray(lead.vehicle.custom_field_values)) {
        lead.vehicle.custom_field_values = lead.vehicle.custom_field_values.map(
          (cf) => ({
            ...cf,
            field: customFieldsMap[cf.custom_field] || null,
          })
        );
      }
    }

    const total = result.total?.[0]?.total || 0;

    return successResponse(res, {
      message: "Leads fetched successfully",
      payload: {
        exitLead: cloneDeep(leads),
        total,
      },
    });
  } catch (error) {
    logger.error(`[GET Lead ERROR] ${error.message}`, {
      error: error.stack,
      user: req.user?._id,
    });
    return internalServerErrorResponse(res, {
      message: "Something went wrong",
      error: error.message || "Unknown error",
    });
  }
};

const getHideLead = async (req, res) => {
  try {
    logger.log("[GET LEAD] API Called");

    const { _id } = req.user;
    const garage = await GARAGE.findById(_id);
    if (!garage) {
      return badRequestResponse(res, { message: "Garage not found" });
    }

    const filter = req.query.filter || "any";
    const days = parseInt(req.query.days); // will be NaN if not provided

    const matchCondition = {
      garage_id: _id,
      status: "hide",
      is_deleted: false,
    };

    // Apply filter conditions
    switch (filter) {
      case "vehicle":
        matchCondition["vehicle"] = { $exists: true, $ne: null };
        break;
      case "dropoff":
        matchCondition["drop.pickup_type"] = { $exists: true, $ne: null };
        break;
      case "timeslot":
        matchCondition["drop.date"] = { $exists: true, $ne: null };
        matchCondition["drop.time"] = { $exists: true, $ne: null };
        break;
      case "any":
      default:
        break;
    }

    // Apply days-old filter if valid
    if (!isNaN(days) && days >= 0) {
      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - days);
      start.setHours(0, 0, 0, 0);

      const end = new Date(now);
      end.setDate(end.getDate() - days);
      end.setHours(23, 59, 59, 999);

      matchCondition["createdAt"] = { $gte: start, $lte: end };
    }
    const [customFieldsDef] = await CUSTOM_FIELDS.find({
      custom_type: "VEHICLE",
      garage_id: _id,
    });
    const customFieldsMap = {};
    for (const field of customFieldsDef?.custom_fields || []) {
      customFieldsMap[field._id.toString()] = field;
    }
    const exitLead = await LEADS.aggregate([
      {
        $match: matchCondition,
      },
      {
        $lookup: {
          from: "users",
          let: { userId: "$user" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$userId"] },
              },
            },
            {
              $project: {
                first_name: 1,
                last_name: 1,
                phone: 1,
              },
            },
          ],
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "vehicles",
          let: { vehicleId: "$vehicle" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$vehicleId"] },
              },
            },
          ],
          as: "vehicle",
        },
      },
      {
        $unwind: {
          path: "$vehicle",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $facet: {
          exitLead: [
            ...getPagination(req?.query?.page, req?.query?.limit),
            { $unset: ["garage_id"] },
          ],
          total: [{ $count: "total" }],
        },
      },
    ]);

    const result = exitLead[0] || {};
    const leads = result.exitLead || [];
    for (const lead of leads) {
      if (lead.vehicle && Array.isArray(lead.vehicle.custom_field_values)) {
        lead.vehicle.custom_field_values = lead.vehicle.custom_field_values.map(
          (cf) => ({
            ...cf,
            field: customFieldsMap[cf.custom_field] || null,
          })
        );
      }
      if (Array.isArray(lead.issue_tree)) {
        const issueTree = await ISSUE_TREE.findOne({ garage_id: _id }).lean();
        if (!issueTree) continue;

        for (const node of lead.issue_tree) {
          const category = issueTree.categories.find(
            (cat) => cat._id.toString() === node.category_id?.toString()
          );

          const service = category?.services.find(
            (srv) => srv._id.toString() === node.service_id?.toString()
          );

          const question = service?.questions.find(
            (qst) => qst._id.toString() === node.question_id?.toString()
          );

          const option = question?.options.find(
            (opt) => opt._id.toString() === node.option_id?.toString()
          );

          node.category_name = category?.name || null;
          node.service_name = service?.name || null;
          node.service_description = service?.description || null;
          node.question_title = question?.title || null;
          node.option_text = option?.option_text || null;
          node.option_description = option?.description || null;
        }
      }
    }
    const total = result.total?.[0]?.total || 0;

    return successResponse(res, {
      message: "Leads fetched successfully",
      payload: {
        exitLead: cloneDeep(leads),
        total,
      },
    });
  } catch (error) {
    logger.error(`[GET Lead ERROR] ${error.message}`, {
      error: error.stack,
      user: req.user?._id,
    });
    return internalServerErrorResponse(res, {
      message: "Something went wrong",
      error: error.message || "Unknown error",
    });
  }
};

const toggleLeadStatus = async (req, res) => {
  try {
    logger.log("[TOGGLE LEAD STATUS] API Called");

    const { _id } = req.user; // garage owner ID
    const { leadID } = req.params;
    const { status } = req.body; // new status from client

    if (!["show", "hide"].includes(status)) {
      return badRequestResponse(res, { message: "Invalid status value" });
    }

    const garage = await GARAGE.findById(_id);
    if (!garage) {
      return badRequestResponse(res, { message: "Garage not found" });
    }

    const lead = await LEADS.findOne({
      _id: leadID,
      garage_id: _id,
      is_deleted: false,
    });
    if (!lead) {
      return badRequestResponse(res, {
        message: "Lead not found or access denied",
      });
    }

    const updatedLead = await LEADS.findByIdAndUpdate(
      leadID,
      { $set: { status } },
      { new: true }
    );

    return successResponse(res, {
      message: `Lead status updated to '${status}' successfully`,
    });
  } catch (error) {
    logger.error(`[TOGGLE LEAD STATUS ERROR] ${error.message}`, {
      error: error.stack,
      user: req.user?._id,
    });

    return internalServerErrorResponse(res, {
      message: "Failed to update lead status",
      error: error.message,
    });
  }
};

const deleteLead = async (req, res) => {
  try {
    logger.log("[DELETE LEAD] API Called");

    const { _id } = req.user; // garage owner ID
    const { leadID } = req.params;
    const { code } = req.params;
    const garage = await GARAGE.findById(_id);
    const marketingLink = await MARKETING_LINK.findOne({ code });
    if (!garage) {
      return badRequestResponse(res, { message: "Garage not found" });
    }

    const lead = await LEADS.findOne({ _id: leadID, garage_id: _id });

    if (
      marketingLink &&
      marketingLink.scan &&
      Array.isArray(marketingLink.scan.lead)
    ) {
      // Filter out the lead_id from the 'scan.lead' array
      marketingLink.scan.lead = marketingLink.scan.lead.filter(
        (leadItem) => leadItem.lead_id.toString() !== leadID.toString()
      );

      // Save the marketing link after updating the 'scan.lead' array
      await marketingLink.save();
    }

    if (!lead) {
      return badRequestResponse(res, {
        message: "Lead not found or unauthorized access",
      });
    }

    // // Delete only the lead
    // await LEADS.deleteOne({ _id: leadID });
    lead.is_deleted = true;
    await lead.save();

    return successResponse(res, {
      message: "Lead deleted successfully",
    });
  } catch (error) {
    logger.error(`[DELETE LEAD ERROR] ${error.message}`, {
      error: error.stack,
      user: req.user?._id,
    });

    return internalServerErrorResponse(res, {
      message: "Failed to delete lead",
      error: error.message,
    });
  }
};

const getLeadsByDateRange = async (req, res) => {
  try {
    logger.log("[GET LEADS BY DATE RANGE] API Called");

    const { _id } = req.user;
    const garage = await GARAGE.findById(_id);
    if (!garage) {
      return badRequestResponse(res, { message: "Garage not found" });
    }

    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return badRequestResponse(res, {
        message:
          "Both startDate and endDate are required in YYYY-MM-DD format.",
      });
    }

    // Convert to start-of-day and end-of-day Date objects
    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    const matchCondition = {
      garage_id: _id,
      status: "show",
      is_deleted: false,
      createdAt: { $gte: start, $lte: end },
    };

    logger.log("Match condition:", matchCondition);

    const leads = await LEADS.find(matchCondition)
      .select("-garage_id")
      .populate("user")
      .populate("vehicle")
      .sort({ createdAt: -1 });

    return successResponse(res, {
      message: "Leads fetched successfully",
      payload: {
        leads,
        count: leads.length,
      },
    });
  } catch (error) {
    logger.error(`[GET Leads by Date ERROR] ${error.message}`, {
      error: error.stack,
      user: req.user?._id,
    });
    return internalServerErrorResponse(res, {
      message: "Something went wrong",
      error: error.message || "Unknown error",
    });
  }
};

const getDropLead = async (req, res) => {
  try {
    logger.log("[GET DROP LEAD] API Called");

    const { _id } = req.user;
    const { leadID } = req.params;

    // Check if the garage exists
    const garage = await GARAGE.findById(_id);
    if (!garage) {
      return badRequestResponse(res, { message: "Garage not found" });
    }

    // Fetch required options and capacity
    const [pickupOption, waiterCapacity, dropOffCapacity, warningtext] =
      await Promise.all([
        PICKUP_OPTION.findOne({ garage_id: _id }),
        WAITER_CAPACITY.findOne({ garage_id: _id }),
        DROP_OFF_CAPACITY.findOne({ garage_id: _id }),
        DROPOFF_WAITING_WARNING.findOne({ garage_id: _id }),
      ]);

    // If any of the options are missing, return error
    if (!pickupOption || !waiterCapacity || !dropOffCapacity) {
      return badRequestResponse(res, {
        message:
          "Pickup Option, Waiter Capacity or Drop Off Capacity not found",
      });
    }

    // Check if the lead exists
    const lead = await LEADS.findOne({ _id: leadID, garage_id: _id }).populate(
      "vehicle"
    );
    if (!lead) {
      return badRequestResponse(res, {
        message: "Lead not found or unauthorized access",
      });
    }

    // Fetch related services
    const services = await SERVICES.find({ _id: { $in: lead?.services } });

    // Check for enabled services
    const isWaiterEnabled = services.every(
      (service) => service.is_waiter === true
    );
    const isDropoffEnabled = services.every(
      (service) => service.is_dropoff === true
    );
    const isPickupEnabled = services.every(
      (service) => service.is_pickup === true
    );

    // Default values for pickup option
    let pickupShow = false;
    let pickupWarning = null;

    if (pickupOption.is_enabled && isPickupEnabled) {
      // Try to fetch the user associated with the lead
      const user = await USER.findOne({ _id: lead.user });
      if (user) {
        // Fetch pickup customer exceptions
        const pickupCustomer = await CUSTOMER_EXCEPTIONS_FOR_PICKUP.find({
          garage_id: _id,
        });
        // Find if the user phone matches any exception **and** exception_type is "allow"
        const match = Array.isArray(pickupCustomer)
          ? pickupCustomer.find(
            (c) => c.phone === user.phone && c.exception_type === "allow"
          )
          : pickupCustomer?.phone === user.phone &&
          pickupCustomer?.exception_type === "allow";
        const vehicle = lead.vehicle;
        const isModelExcluded = pickupOption.excluded_models?.some(
          (excludedMake) =>
            excludedMake.make_name === vehicle.make ||
            excludedMake.models.some(
              (model) => model.model_name === vehicle.model
            )
        );
        if (match && isModelExcluded && isPickupEnabled) {
          pickupShow = true;
          pickupWarning = warningtext?.pickup || null;
        }
      } else {
        // Log if the user is not found
        logger.warn(`[GET DROP LEAD] User not found for lead ${leadID}`);
      }
    }

    // Prepare the response
    const response = {
      message: "Drop lead fetched successfully",
      pickupOption: {
        show: pickupShow,
        // show : true ,
        warning: pickupWarning || null,
      },
      waiterCapacity: {
        show: isWaiterEnabled,
        warning: warningtext?.waiter || null,
      },
      dropOffCapacity: {
        show: isDropoffEnabled,
        warning: warningtext?.drop_off || null,
      },
    };

    return successResponse(res, response);
  } catch (error) {
    logger.error(`[GET DROP LEAD ERROR] ${error.message}`, {
      error: error.stack,
      user: req.user?._id,
    });

    return internalServerErrorResponse(res, {
      message: "Failed to get drop lead",
      error: error.message,
    });
  }
};

const generateTimeSlots = (startTime, endTime, interval) => {
  const slots = [];
  let start = moment(startTime, "hh:mm A");
  const end = moment(endTime, "hh:mm A");

  while (start.isBefore(end)) {
    slots.push(start.format("hh:mm A"));
    start.add(interval, "minutes");
  }

  return slots;
};


const getScheduledAppointmentDrop = async (req, res) => {
  try {
    logger.log("[GET SCHEDULED APPOINTMENT DROP] API Called");
    const { _id } = req.user;
    const { leadID } = req.params;
    const garage = await GARAGE.findById(_id);
    if (!garage)
      return badRequestResponse(res, { message: "Garage not found" });
    const lead = await LEADS.findOne({ _id: leadID, garage_id: _id });
    if (!lead)
      return badRequestResponse(res, {
        message: "Lead not found or unauthorized access",
      });
    const garageSettings = await GARAGE_SETTINGS.findOne({ garage_id: _id });

    let serviceIds = [];

    if (Array.isArray(lead.service)) {
      serviceIds = lead.service.flatMap((serviceString) =>
        serviceString
          .split(",")
          .map((id) => id.trim())
          .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
      );
    } else if (typeof lead.service === "string") {
      serviceIds = lead.service
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id && mongoose.Types.ObjectId.isValid(id));
    }

    const services = await SERVICES.find({ _id: { $in: serviceIds } });
    const [monthSettings, dropOffCapacity, calendarNote, capacityBlockers] =
      await Promise.all([
        MISC_SETTINGS.findOne({ garage_id: _id }),
        DROP_OFF_CAPACITY.findOne({ garage_id: _id }),
        CALENDAR_NOTE.findOne({ garage_id: _id }),
        CAPACITY_BLOCKER.find({ garage_id: _id, is_enable: true }),
      ]);

    let totalEstimatedTime = 0;

    if (monthSettings?.is_use_single_service_duration) {
      totalEstimatedTime = services
        .filter((service) => service.is_dropoff)
        .reduce(
          (sum, service) => sum + (parseInt(service.estimated_minutes) || 0),
          0
        );
    } else {
      totalEstimatedTime = Math.max(
        ...services.map((service) => parseInt(service.estimated_minutes) || 0)
      );
    }

    // If none found, fallback to your default interval
    const finalInterval = totalEstimatedTime > 0 ? totalEstimatedTime : 10;

    if (!monthSettings || !dropOffCapacity || !calendarNote) {
      return badRequestResponse(res, {
        message: "Missing MISC_SETTINGS, DROP_OFF_CAPACITY, or CALENDAR_NOTE",
      });
    }
    const interval = parseInt(
      dropOffCapacity?.automatic_appointment_times?.timeslot_interval || 10
    );
    const schedulingHours =
      dropOffCapacity?.automatic_appointment_times?.scheduling_hours || [];
    const textTimeslots =
      dropOffCapacity?.automatic_appointment_times?.text_timeslot || [];
    const notes = calendarNote?.drop_off || "";

    const disabledDates = [];
    const shopHours = garageSettings?.shop_hours || [];

    const holidayBlockers = capacityBlockers.filter(
      (cb) => cb.block_type === "holiday_blocker"
    );
    const otherBlockers = capacityBlockers.filter(
      (cb) => cb.block_type !== "holiday_blocker"
    );
    const timeZone = garage?.timezone || "America/New_York";
    // Apply other blockers
    otherBlockers.forEach((blocker) => {
      const blockFor = parseInt(blocker?.block_for_days?.value || 0);
      const blockAfter = parseInt(blocker?.block_after_days?.value || 0);

      if (!isNaN(blockFor) && !isNaN(blockAfter)) {
        const blockStartDate = moment().add(blockAfter, "days");
        for (let i = 0; i < blockFor; i++) {
          const dateStr = blockStartDate
            .clone()
            .add(i, "days")
            .format("YYYY-MM-DD");
          if (!disabledDates.includes(dateStr)) {
            disabledDates.push(dateStr);
          }
        }
      }

      if (blocker.is_enable && blocker.start_on) {
        const startDate = moment(blocker.start_on);

        if (blocker.end_on) {
          const endDate = moment(blocker.end_on);
          while (startDate.isSameOrBefore(endDate, "day")) {
            const dateStr = startDate.format("YYYY-MM-DD");
            if (!disabledDates.includes(dateStr)) {
              disabledDates.push(dateStr);
            }
            startDate.add(1, "day");
          }
        } else {
          // Only start_on date to disable
          const dateStr = startDate.format("YYYY-MM-DD");
          if (!disabledDates.includes(dateStr)) {
            disabledDates.push(dateStr);
          }
        }
      }
      if (
        blocker.is_enable &&
        blocker.block_type === "schedule_blocker_repeating" &&
        blocker.days_of_week.length > 0
      ) {
        const today = moment();
        const endDate = moment().add(5, "months"); // Or whatever future window you want to pre-block
        const daysOfWeek = blocker.days_of_week.map((day) => day.toLowerCase());

        const iterDate = today.clone();
        while (iterDate.isSameOrBefore(endDate, "day")) {
          const dayName = iterDate.format("dddd").toLowerCase();
          if (daysOfWeek.includes(dayName)) {
            const dateStr = iterDate.format("YYYY-MM-DD");
            if (!disabledDates.includes(dateStr)) {
              disabledDates.push(dateStr);
            }
          }
          iterDate.add(1, "day");
        }
      }
    });
    // Apply holiday blockers for this year and next 4 years
    holidayBlockers.forEach((blocker) => {
      if (blocker.is_enable && blocker.selected_holiday?.us?.date) {
        const holidayDate = moment(
          blocker.selected_holiday.us.date,
          "YYYY-MM-DD HH:mm:ss"
        );

        for (let yearOffset = 0; yearOffset < 5; yearOffset++) {
          const dateStr = holidayDate
            .clone()
            .add(yearOffset, "years")
            .format("YYYY-MM-DD");
          if (!disabledDates.includes(dateStr)) {
            disabledDates.push(dateStr);
          }
        }
      }
    });
    const monthCount = parseInt(monthSettings?.booking_window || 1);
    const startDate = moment().tz(timeZone).startOf("day");
    const endDate = moment.tz(startDate, timeZone)
      .add(monthCount, "months")
      .endOf("month");
    const availability = [];
    let currentDate = startDate.clone();
    while (currentDate.isSameOrBefore(endDate, "day")) {
      const dateStr = currentDate.format("YYYY-MM-DD");
      const dayName = currentDate.format("dddd").toLowerCase();
      const isGloballyBlocked = disabledDates.includes(dateStr);

      let slots = [];
      const shopDay = shopHours.find((h) => h.day.toLowerCase() === dayName);
      const isShopClosed = shopDay?.is_closed;
      if (isShopClosed) {
        availability.push({
          date: dateStr,
          slots: [],
        });
        currentDate.add(1, "day");
        continue;
      }
      const schedule = schedulingHours.find(
        (h) => h.day.toLowerCase() === dayName && h.is_closed === false
      );
      let startTime, endTime;
      if (schedule && shopDay && schedule.start && shopDay.start) {
        startTime = moment
          .max(
            moment(schedule.start, "hh:mm A"),
            moment(shopDay.start, "hh:mm A")
          )
          .format("hh:mm A");

        endTime = moment
          .min(moment(schedule.end, "hh:mm A"), moment(shopDay.end, "hh:mm A"))
          .format("hh:mm A");
        // continue with slot generation
      } else {
        availability.push({
          date: dateStr,
          timeslots: [],
        });
        currentDate.add(1, "day");
        continue;
      }
      if (
        schedule &&
        !isGloballyBlocked &&
        dropOffCapacity.mode === "automatic" &&
        dropOffCapacity.automatic_appointment_times?.is_show_dropoff
      ) {
        // Generate slots
        slots = generateTimeSlots(startTime, endTime, interval);
     

        // Apply time-based blockers
        capacityBlockers.forEach((blocker) => {
          if (!["dropoff", "all"].includes(blocker.apply_to_appointment_types))
            return;

          const {
            days_of_week,
            start_time: blockStart,
            end_time: blockEnd,
          } = blocker;

          const isDayBlocked =
            Array.isArray(days_of_week) && days_of_week.includes(dayName);
          if (isDayBlocked) {
            // Block slots within a time range
            if (blockStart && blockEnd) {
              const blockStartTime = moment(blockStart, "hh:mm A");
              const blockEndTime = moment(blockEnd, "hh:mm A");

              slots = slots.filter((slot) => {
                const slotTime = moment(slot, "hh:mm A");
                return (
                  slotTime.isBefore(blockStartTime) ||
                  slotTime.isSameOrAfter(blockEndTime)
                );
              });
            }
            // If full day blocked (repeating) and no time specified
            if (!blockStart || !blockEnd) {
              slots = [];
            }
          }
        });

        // Format slots with time + date
        slots = slots.map((slot, index) => {
          const start = moment(
            `${dateStr} ${slot}`,
            "YYYY-MM-DD hh:mm A"
          );
          return {
            id: `${dateStr}-${index}`,
            label: slot,
            start: start.format("YYYY-MM-DDTHH:mm:ss"),
            end: start.clone().add(interval, "minutes").format("YYYY-MM-DDTHH:mm:ss"),
          };
        });
        const formattedTextSlots = textTimeslots.map((textSlot, index) => {
          const start = moment(
            `${dateStr} ${textSlot.time}`,
            "YYYY-MM-DD hh:mm A"
          )
          return {
            id: `${dateStr}-text-${index}`,
            label: textSlot.text,
            start: start.format("YYYY-MM-DDTHH:mm:ss"),
            end: start.clone().add(interval, "minutes").format("YYYY-MM-DDTHH:mm:ss"),
            is_text_timeslot: true,
            is_always_available: textSlot.is_always_available,
            text_slot_id: textSlot._id?.toString(),
          };
        });

        slots = [...slots, ...formattedTextSlots];
      } else if (
        schedule &&
        !isGloballyBlocked &&
        dropOffCapacity.mode === "automatic" &&
        dropOffCapacity.automatic_appointment_times?.is_show_dropoff === false
      ) {
        const notes = calendarNote?.drop_off || "";

        slots = [
          {
            id: `${dateStr}-note`,
            label: notes,
            start: null,
            end: null,
          },
        ];
      } else if (
        schedule &&
        !isGloballyBlocked &&
        dropOffCapacity.mode === "manual"
      ) {
        const manualSchedule =
          dropOffCapacity?.manual_appointment_times?.scheduling_time || [];
        const manualDaySchedule = manualSchedule.find(
          (d) => d.day.toLowerCase() === dayName
        );

        if (manualDaySchedule && manualDaySchedule.timings.length > 0) {
          const hasRepeatingBlocker = capacityBlockers.some((blocker) => {
            return (
              ["dropoff", "all"].includes(blocker.apply_to_appointment_types) &&
              Array.isArray(blocker.days_of_week) &&
              blocker.days_of_week.includes(dayName) &&
              (!blocker.start_time || !blocker.end_time)
            );
          });

          if (!hasRepeatingBlocker) {
            slots = manualDaySchedule.timings.map((slot, index) => {
              const start = moment(
                `${dateStr} ${slot.label}`,
                "YYYY-MM-DD hh:mm A"
              );
              const safeInterval =
                finalInterval && !isNaN(finalInterval) && finalInterval > 0
                  ? finalInterval
                  : 30;
              const end = start.clone().add(safeInterval, "minutes").format("YYYY-MM-DDTHH:mm:ss");
              return {
                id: `${dateStr}-${index}`,
                label: slot.label,
                start: start.format("YYYY-MM-DDTHH:mm:ss"),
                end: end,
              };
            });
          } else {
            // Full-day blocker applies, so no slots
            slots = [];
          }
        }
      }

      availability.push({
        date: dateStr,
        timeslots: slots,
      });

      currentDate.add(1, "day");
    }

    return successResponse(res, {
      message: "Drop lead fetched successfully",
      month: monthSettings.booking_window,
      availability,
      notes,
    });
  } catch (error) {
    logger.error(`[GET SCHEDULED APPOINTMENT DROP ERROR] ${error.message}`, {
      error: error.stack,
      user: req.user?._id,
    });
    return internalServerErrorResponse(res, {
      message: "Something went wrong",
      error: error.message || "Unknown error",
    });
  }
};

const getScheduledAppointmentWaiter = async (req, res) => {
  try {
    logger.log("[GET SCHEDULED APPOINTMENT Waiter] API Called");
    const { _id } = req.user;

    const garage = await GARAGE.findById(_id);
    if (!garage)
      return badRequestResponse(res, { message: "Garage not found" });
    const { leadID } = req.params;
    const lead = await LEADS.findOne({ _id: leadID, garage_id: _id });
    const garageSettings = await GARAGE_SETTINGS.findOne({ garage_id: _id });
    let serviceIds = [];
    if (Array.isArray(lead.service)) {
      serviceIds = lead.service.flatMap((serviceString) =>
        serviceString
          .split(",")
          .map((id) => id.trim())
          .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
      );
    } else if (typeof lead.service === "string") {
      serviceIds = lead.service
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id && mongoose.Types.ObjectId.isValid(id));
    }
    const services = await SERVICES.find({ _id: { $in: serviceIds } });
    const [monthSettings, waiterCapacity, calendarNote, capacityBlockers] =
      await Promise.all([
        MISC_SETTINGS.findOne({ garage_id: _id }),
        WAITER_CAPACITY.findOne({ garage_id: _id }),
        CALENDAR_NOTE.findOne({ garage_id: _id }),
        CAPACITY_BLOCKER.find({ garage_id: _id, is_enable: true }),
      ]);
    if (!monthSettings || !waiterCapacity || !calendarNote) {
      return badRequestResponse(res, {
        message: "Missing MISC_SETTINGS, WAITER_CAPACITY, or CALENDAR_NOTE",
      });
    }
    let totalEstimatedTime = 0;
    if (monthSettings?.is_use_single_service_duration) {
      totalEstimatedTime = services
        .filter((service) => service.is_waiter)
        .reduce(
          (sum, service) => sum + (parseInt(service.estimated_minutes) || 0),
          0
        );
    } else {
      totalEstimatedTime = Math.max(
        ...services.map((service) => parseInt(service.estimated_minutes) || 0)
      );
    }
    // If none found, fallback to your default interval
    const finalInterval = totalEstimatedTime > 0 ? totalEstimatedTime : 30;
    const timeZone = garage.timezone;
    const interval = parseInt(
      waiterCapacity?.automatic_appointment_times?.timeslot_interval || 30
    );
    const schedulingHours =
      waiterCapacity?.automatic_appointment_times?.scheduling_hours || [];
    const textTimeslots =
      waiterCapacity?.automatic_appointment_times?.text_timeslot || [];
    const notes = calendarNote?.waiter || "";
    const disabledDates = [];
    const shopHours = garageSettings?.shop_hours || [];

    const holidayBlockers = capacityBlockers.filter(
      (cb) => cb.block_type === "holiday_blocker"
    );
    const otherBlockers = capacityBlockers.filter(
      (cb) => cb.block_type !== "holiday_blocker"
    );

    // Apply other blockers
    otherBlockers.forEach((blocker) => {
      const blockFor = parseInt(blocker?.block_for_days?.value || 0);
      const blockAfter = parseInt(blocker?.block_after_days?.value || 0);

      if (!isNaN(blockFor) && !isNaN(blockAfter)) {
        const blockStartDate = moment().add(blockAfter, "days");
        for (let i = 0; i < blockFor; i++) {
          const dateStr = blockStartDate
            .clone()
            .add(i, "days")
            .format("YYYY-MM-DD");
          if (!disabledDates.includes(dateStr)) {
            disabledDates.push(dateStr);
          }
        }
      }

      if (blocker.is_enable && blocker.start_on) {
        const startDate = moment(blocker.start_on);

        if (blocker.end_on) {
          const endDate = moment(blocker.end_on);
          while (startDate.isSameOrBefore(endDate, "day")) {
            const dateStr = startDate.format("YYYY-MM-DD");
            if (!disabledDates.includes(dateStr)) {
              disabledDates.push(dateStr);
            }
            startDate.add(1, "day");
          }
        } else {
          // Only start_on date to disable
          const dateStr = startDate.format("YYYY-MM-DD");
          if (!disabledDates.includes(dateStr)) {
            disabledDates.push(dateStr);
          }
        }
      }
      if (
        blocker.is_enable &&
        blocker.block_type === "schedule_blocker_repeating" &&
        blocker.days_of_week.length > 0
      ) {
        const today = moment();
        const endDate = moment().add(5, "months"); // Or whatever future window you want to pre-block
        const daysOfWeek = blocker.days_of_week.map((day) => day.toLowerCase());

        const iterDate = today.clone();
        while (iterDate.isSameOrBefore(endDate, "day")) {
          const dayName = iterDate.format("dddd").toLowerCase();
          if (daysOfWeek.includes(dayName)) {
            const dateStr = iterDate.format("YYYY-MM-DD");
            if (!disabledDates.includes(dateStr)) {
              disabledDates.push(dateStr);
            }
          }
          iterDate.add(1, "day");
        }
      }
    });

    // Apply holiday blockers for this year and next 4 years
    holidayBlockers.forEach((blocker) => {
      if (blocker.is_enable && blocker.selected_holiday?.us?.date) {
        const holidayDate = moment(
          blocker.selected_holiday.us.date,
          "YYYY-MM-DD HH:mm:ss"
        );

        for (let yearOffset = 0; yearOffset < 5; yearOffset++) {
          const dateStr = holidayDate
            .clone()
            .add(yearOffset, "years")
            .format("YYYY-MM-DD");
          if (!disabledDates.includes(dateStr)) {
            disabledDates.push(dateStr);
          }
        }
      }
    });

    const monthCount = parseInt(monthSettings?.booking_window || 1);
    const startDate = moment().tz(timeZone).startOf("day");
    const endDate = moment.tz(startDate, timeZone)
      .add(monthCount, "months")
      .endOf("month");
    const availability = [];
    let currentDate = startDate.clone();
    while (currentDate.isSameOrBefore(endDate, "day")) {
      const dateStr = currentDate.format("YYYY-MM-DD");
      const dayName = currentDate.format("dddd").toLowerCase();
      const isGloballyBlocked = disabledDates.includes(dateStr);

      let slots = [];
      const shopDay = shopHours.find((h) => h.day.toLowerCase() === dayName);
      const isShopClosed = shopDay?.is_closed;
      if (isShopClosed) {
        availability.push({
          date: dateStr,
          slots: [],
        });
        currentDate.add(1, "day");
        continue;
      }
      const schedule = schedulingHours.find(
        (h) => h.day.toLowerCase() === dayName && h.is_closed === false
      );
      let startTime, endTime;
      if (schedule && shopDay && schedule.start && shopDay.start) {
        startTime = moment
          .max(
            moment(schedule.start, "hh:mm A"),
            moment(shopDay.start, "hh:mm A")
          )
          .format("hh:mm A");

        endTime = moment
          .min(moment(schedule.end, "hh:mm A"), moment(shopDay.end, "hh:mm A"))
          .format("hh:mm A");
        // continue with slot generation
      } else {
        availability.push({
          date: dateStr,
          timeslots: [],
        });
        currentDate.add(1, "day");
        continue;
      }
      if (
        schedule &&
        !isGloballyBlocked &&
        waiterCapacity.mode === "automatic"
      ) {
        // Generate slots
        // slots = generateTimeSlots(schedule.start, schedule.end, interval);
        slots = generateTimeSlots(startTime, endTime, interval);

        // Apply time-based blockers
        capacityBlockers.forEach((blocker) => {
          if (!["waiter", "all"].includes(blocker.apply_to_appointment_types))
            return;
          const {
            days_of_week,
            start_time: blockStart,
            end_time: blockEnd,
          } = blocker;

          const isDayBlocked =
            Array.isArray(days_of_week) && days_of_week.includes(dayName);
          if (isDayBlocked) {
            // console.log(
            //   `[BLOCKER HIT] ${dateStr} (${dayName}) blocked by`,
            //   blocker
            // );
          }
          if (isDayBlocked) {
            // Block slots within a time range
            if (blockStart && blockEnd) {
              const blockStartTime = moment(blockStart, "hh:mm A");
              const blockEndTime = moment(blockEnd, "hh:mm A");

              slots = slots.filter((slot) => {
                const slotTime = moment(slot, "hh:mm A");
                return (
                  slotTime.isBefore(blockStartTime) ||
                  slotTime.isSameOrAfter(blockEndTime)
                );
              });
            }

            // If full day blocked (repeating) and no time specified
            if (!blockStart || !blockEnd) {
              slots = [];
            }
          }
        });

        // Format slots with time + date
        slots = slots.map((slot, index) => {
          const start = moment(
            `${dateStr} ${slot}`,
            "YYYY-MM-DD hh:mm A"
          )
          return {
            id: `${dateStr}-${index}`,
            label: slot,
            start: start.format("YYYY-MM-DDTHH:mm:ss"),
            end: start.clone().add(interval, "minutes").format("YYYY-MM-DDTHH:mm:ss"),
          };
        });
        const formattedTextSlots = textTimeslots.map((textSlot, index) => {
          const start = moment(
            `${dateStr} ${textSlot.time}`,
            "YYYY-MM-DD hh:mm A"
          )
          return {
            id: `${dateStr}-text-${index}`,
            label: textSlot.text,
            start: start.format("YYYY-MM-DDTHH:mm:ss"),
            end: start.clone().add(interval, "minutes").format("YYYY-MM-DDTHH:mm:ss"),
            is_text_timeslot: true,
            is_always_available: textSlot.is_always_available,
            text_slot_id: textSlot._id?.toString(),
          };
        });

        slots = [...slots, ...formattedTextSlots];
      } else if (
        schedule &&
        !isGloballyBlocked &&
        waiterCapacity.mode === "manual"
      ) {
        const manualSchedule =
          waiterCapacity?.manual_appointment_times?.scheduling_time || [];
        const manualDaySchedule = manualSchedule.find(
          (d) => d.day.toLowerCase() === dayName
        );

        if (manualDaySchedule && manualDaySchedule.timings.length > 0) {
          const hasRepeatingBlocker = capacityBlockers.some((blocker) => {
            return (
              ["waiter", "all"].includes(blocker.apply_to_appointment_types) &&
              Array.isArray(blocker.days_of_week) &&
              blocker.days_of_week.includes(dayName) &&
              (!blocker.start_time || !blocker.end_time)
            );
          });

          if (!hasRepeatingBlocker) {
            slots = manualDaySchedule.timings.map((slot, index) => {
              const start = moment(
                `${dateStr} ${slot.label}`,
                "YYYY-MM-DD hh:mm A"
              )
              const safeInterval =
                finalInterval && !isNaN(finalInterval) && finalInterval > 0
                  ? finalInterval
                  : 30;
              const end = start.clone().add(safeInterval, "minutes").format("YYYY-MM-DDTHH:mm:ss"); return {
                id: `${dateStr}-${index}`,
                label: slot.label,
                start: start.format("YYYY-MM-DDTHH:mm:ss"),
                end: end,
              };
            });
          } else {
            // Full-day blocker applies, so no slots
            slots = [];
          }
        }
      }

      availability.push({
        date: dateStr,
        timeslots: slots,
      });

      currentDate.add(1, "day");
    }

    return successResponse(res, {
      message: "Waiter lead fetched successfully",
      month: monthSettings.booking_window,
      availability,
      notes,
    });
  } catch (error) {
    logger.error(`[GET SCHEDULED APPOINTMENT WAITER ERROR] ${error.message}`, {
      error: error.stack,
      user: req.user?._id,
    });
    return internalServerErrorResponse(res, {
      message: "Something went wrong",
      error: error.message || "Unknown error",
    });
  }
};

const getScheduledAppointmentPickup = async (req, res) => {
  try {
    logger.log("[GET SCHEDULED APPOINTMENT Pickup] API Called");
    const { _id } = req.user;

    const garage = await GARAGE.findById(_id);
    if (!garage)
      return badRequestResponse(res, { message: "Garage not found" });
    const garageSettings = await GARAGE_SETTINGS.findOne({ garage_id: _id });
    const shopHours = garageSettings?.shop_hours || [];
    const [monthSettings, pickupSettings, calendarNote, capacityBlockers] =
      await Promise.all([
        MISC_SETTINGS.findOne({ garage_id: _id }),
        PICKUP_OPTION.findOne({ garage_id: _id }),
        CALENDAR_NOTE.findOne({ garage_id: _id }),
        CAPACITY_BLOCKER.find({ garage_id: _id, is_enable: true }),
      ]);

    if (!monthSettings || !pickupSettings || !calendarNote) {
      return badRequestResponse(res, {
        message: "Missing MISC_SETTINGS, PICKUP or CALENDAR_NOTE",
      });
    }

    const interval = 30; // or derive based on pickup policy
    const textTimeslots = pickupSettings.pickup_timeslots || [];
    const notes = calendarNote?.pickup || "";
    const disabledDates = [];
    const timeZone = garage?.timezone || "America/New_York";
    const holidayBlockers = capacityBlockers.filter(
      (cb) => cb.block_type === "holiday_blocker"
    );
    const otherBlockers = capacityBlockers.filter(
      (cb) => cb.block_type !== "holiday_blocker"
    );

    // Apply other blockers
    otherBlockers.forEach((blocker) => {
      const blockFor = parseInt(blocker?.block_for_days?.value || 0);
      const blockAfter = parseInt(blocker?.block_after_days?.value || 0);

      if (!isNaN(blockFor) && !isNaN(blockAfter)) {
        const blockStartDate = moment().add(blockAfter, "days");
        for (let i = 0; i < blockFor; i++) {
          const dateStr = blockStartDate
            .clone()
            .add(i, "days")
            .format("YYYY-MM-DD");
          if (!disabledDates.includes(dateStr)) {
            disabledDates.push(dateStr);
          }
        }
      }
      if (blocker.is_enable && blocker.start_on) {
        const startDate = moment(blocker.start_on);

        if (blocker.end_on) {
          const endDate = moment(blocker.end_on);
          while (startDate.isSameOrBefore(endDate, "day")) {
            const dateStr = startDate.format("YYYY-MM-DD");
            if (!disabledDates.includes(dateStr)) {
              disabledDates.push(dateStr);
            }
            startDate.add(1, "day");
          }
        } else {
          // Only start_on date to disable
          const dateStr = startDate.format("YYYY-MM-DD");
          if (!disabledDates.includes(dateStr)) {
            disabledDates.push(dateStr);
          }
        }
      }
      if (
        blocker.is_enable &&
        blocker.block_type === "schedule_blocker_repeating" &&
        blocker.days_of_week.length > 0
      ) {
        const today = moment();
        const endDate = moment().add(5, "months"); // Or whatever future window you want to pre-block
        const daysOfWeek = blocker.days_of_week.map((day) => day.toLowerCase());

        const iterDate = today.clone();
        while (iterDate.isSameOrBefore(endDate, "day")) {
          const dayName = iterDate.format("dddd").toLowerCase();
          if (daysOfWeek.includes(dayName)) {
            const dateStr = iterDate.format("YYYY-MM-DD");
            if (!disabledDates.includes(dateStr)) {
              disabledDates.push(dateStr);
            }
          }
          iterDate.add(1, "day");
        }
      }
    });

    // Apply holiday blockers for this year and next 4 years
    holidayBlockers.forEach((blocker) => {
      if (blocker.is_enable && blocker.selected_holiday?.us?.date) {
        const holidayDate = moment(
          blocker.selected_holiday.us.date,
          "YYYY-MM-DD HH:mm:ss"
        );

        for (let yearOffset = 0; yearOffset < 5; yearOffset++) {
          const dateStr = holidayDate
            .clone()
            .add(yearOffset, "years")
            .format("YYYY-MM-DD");
          if (!disabledDates.includes(dateStr)) {
            disabledDates.push(dateStr);
          }
        }
      }
    });

    const monthCount = parseInt(monthSettings?.booking_window || 1);
    const startDate = moment().tz(timeZone).startOf("day");
    const endDate = moment.tz(startDate, timeZone)
      .add(monthCount, "months")
      .endOf("month");
    const availability = [];

    let currentDate = startDate.clone();
    while (currentDate.isSameOrBefore(endDate, "day")) {
      const dateStr = currentDate.format("YYYY-MM-DD");
      const dayName = currentDate.format("dddd").toLowerCase();
      const isGloballyBlocked = disabledDates.includes(dateStr);

      let slots = [];
      const shopDay = shopHours.find((h) => h.day.toLowerCase() === dayName);
      const isShopClosed = shopDay?.is_closed;
      if (isShopClosed) {
        availability.push({
          date: dateStr,
          slots: [],
        });
        currentDate.add(1, "day");
        continue;
      }
      if (!isGloballyBlocked) {
        // Apply capacity blockers (repeating)
        const hasFullDayBlocker = capacityBlockers.some(
          (blocker) =>
            ["pickup", "all"].includes(blocker.apply_to_appointment_types) &&
            Array.isArray(blocker.days_of_week) &&
            blocker.days_of_week.includes(dayName) &&
            (!blocker.start_time || !blocker.end_time)
        );

        if (!hasFullDayBlocker) {
          slots = textTimeslots.map((slot, index) => {
            const start = moment(
              `${dateStr} ${slot.time_in_sms}`,
              "YYYY-MM-DD HH:mm"
            )
            return {
              id: `${dateStr}-pickup-${index}`,
              label: slot.label,
              start: start.format("YYYY-MM-DDTHH:mm:ss"),
              end: start.clone().add(interval, "minutes").format("YYYY-MM-DDTHH:mm:ss"),
              max_pickup: slot.max_pickup_during_timeslot || 0,
              text_slot_id: slot._id?.toString(),
            };
          });

          // Filter time-based blockers
          capacityBlockers.forEach((blocker) => {
            if (!["pickup", "all"].includes(blocker.apply_to_appointment_types))
              return;
            const isDayBlocked = blocker.days_of_week?.includes(dayName);
            if (!isDayBlocked || !blocker.start_time || !blocker.end_time)
              return;

            const blockStart = moment(blocker.start_time, "hh:mm A");
            const blockEnd = moment(blocker.end_time, "hh:mm A");

            slots = slots.filter((slot) => {
              const slotTime = moment(slot.start).utcOffset(istOffset);
              return (
                slotTime.isBefore(blockStart) ||
                slotTime.isSameOrAfter(blockEnd)
              );
            });
          });
        } else {
          slots = [];
        }
      }

      availability.push({
        date: dateStr,
        timeslots: slots,
      });

      currentDate.add(1, "day");
    }

    return successResponse(res, {
      message: "Pickup availability fetched successfully",
      month: monthSettings.booking_window,
      availability,
      notes,
    });
  } catch (error) {
    logger.error(`[GET SCHEDULED APPOINTMENT PICKUP ERROR] ${error.message}`, {
      error: error.stack,
      user: req.user?._id,
    });
    return internalServerErrorResponse(res, {
      message: "Something went wrong",
      error: error.message || "Unknown error",
    });
  }
};
const getVehicleDetail = async (req, res) => {
  try {
    logger.log("[GET VEHICLE DETAIL]  Api Called");
    const { _id } = req.user;
    const garage = await GARAGE.findById(_id);
    if (!garage)
      return badRequestResponse(res, { message: "Garage not found" });
    const { userId } = req.params;
    let vehicles = await VEHICLE.find({ garage_id: _id, user_id: userId });
    return successResponse(res, {
      message: "Vehicle fetched successfully",
      payload: {
        vehicles,
      },
    });
  } catch (error) {
    logger.error(error);
    return internalServerErrorResponse(res, {
      message: "Something went wrong",
    });
  }
};

export const getTransportationOptions = async (req, res) => {
  try {
    logger.log("[GET Transportation Options] API Called");
    const { _id } = req.user;
    const { leadID } = req.params;
    // Fetch garage
    const garage = await GARAGE.findById(_id);
    if (!garage)
      return badRequestResponse(res, { message: "Garage not found" });

    // Fetch lead with populated vehicle
    const lead = await LEADS.findOne({ _id: leadID, garage_id: _id }).populate(
      "vehicle"
    );
    if (!lead)
      return badRequestResponse(res, {
        message: "Lead not found or unauthorized access",
      });

    // Validate drop and drop time
    const dropTime = lead?.drop?.time;
    if (!dropTime?.start) {
      return badRequestResponse(res, {
        message: "Drop time not found in lead",
      });
    }

    // Use drop time start as base
    const selectedStartTime = moment.utc(dropTime.start);
    const selectedEndTime = moment.utc(dropTime.end);

    // Get day of week for transportation availability check
    const dayOfWeek = selectedStartTime.format("dddd").toLowerCase();

    // Fetch transportation options
    const transportationOption = await TRANSPORTATION_OPTIONS.findOne({
      garage_id: _id,
    });
    if (!transportationOption || !transportationOption.is_enable) {
      return successResponse(res, {
        message: "Transportation not enabled for this garage",
        payload: { isAvailable: false },
      });
    }

    // Get availability for the specific day
    const dayAvailability = transportationOption.hours.find(
      (h) => h.day === dayOfWeek
    );

    if (!dayAvailability || !dayAvailability.is_available) {
      return successResponse(res, {
        message: `Transportation not available on ${dayOfWeek}`,
        payload: { isAvailable: false },
      });
    }

    // Build available start and end times on same date as drop time start
    const availableStartTime = moment.utc(
      selectedStartTime.format("YYYY-MM-DD") +
      `T${dayAvailability.start_time}:00`
    );
    const availableEndTime = moment.utc(
      selectedStartTime.format("YYYY-MM-DD") + `T${dayAvailability.end_time}:00`
    );

    // Compare selected time window within availability window
    const isWithinTime = selectedStartTime.isBetween(
      availableStartTime,
      availableEndTime,
      undefined,
      "[)"
    );

    // Return result
    return successResponse(res, {
      message: "Transportation availability checked successfully",
      isAvailable: isWithinTime,
      details: {
        dayAvailability,
        selectedStartTime: selectedStartTime.format(),
        selectedEndTime: selectedEndTime.format(),
        availableStartTime: availableStartTime.format(),
        availableEndTime: availableEndTime.format(),
      },
      transportationOptions: transportationOption?.request_options,
    });
  } catch (error) {
    logger.error(error);
    return internalServerErrorResponse(res, {
      message: "Something went wrong",
    });
  }
};

// GET pickup distance between a garage (from user id) and given lat/lon

export const getPickupDistance = async (req, res) => {
  try {
    const { _id } = req.user;
    const { lat, lon } = req.body;

    // Fetch garage location
    const garage = await GARAGE.findById(_id);
    if (!garage) {
      return badRequestResponse(res, { message: "Garage not found" });
    }

    // Fetch pickup option config
    const pickupOption = await PICKUP_OPTION.findOne({ garage_id: _id });
    if (!pickupOption) {
      return badRequestResponse(res, {
        message: "Pickup option not configured for this garage",
      });
    }

    // Use aggregation to compute distance
    const result = await GARAGE.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(lon), parseFloat(lat)], // [lon, lat]
          },
          distanceField: "distance",
          spherical: true,
          query: { _id: _id }, // ✅ fixed this line
        },
      },
      { $limit: 1 },
    ]);

    if (!result.length) {
      return badRequestResponse(res, { message: "No nearby garage found" });
    }

    const distanceInMeters = result[0].distance;
    const maxDistanceInMeters = pickupOption.max_distance_from_garage * 1000;

    if (distanceInMeters > maxDistanceInMeters) {
      return res.status(200).json({
        status: "so_far",
        message: `Pickup location is too far. Distance: ${(
          distanceInMeters / 1000
        ).toFixed(2)} km`,
      });
    }

    res.status(200).json({
      status: "success",
      message: `Pickup location is within allowed distance. Distance: ${(
        distanceInMeters / 1000
      ).toFixed(2)} km`,
    });
  } catch (error) {
    logger.error(`[GET PICKUP DISTANCE ERROR] ${error.message}`, {
      error: error.stack,
      user: req.user?._id,
    });
    return internalServerErrorResponse(res, {
      message: "Something went wrong",
      error: error.message || "Unknown error",
    });
  }
};

export const getLeadById = async (req, res) => {
  try {
    logger.log("[GET LEAD BY ID] API Called");

    const { _id } = req.user; // garage owner ID
    const { leadID } = req.params;

    // Validate garage exists
    const garage = await GARAGE.findById(_id);
    if (!garage) {
      return badRequestResponse(res, { message: "Garage not found" });
    }

    // Fetch lead with garage ownership check
    const lead = await LEADS.findOne({ _id: leadID, garage_id: _id })
      .populate("user")
      .populate("vehicle");

    if (!lead) {
      return badRequestResponse(res, {
        message: "Lead not found or unauthorized access",
      });
    }

    return successResponse(res, {
      message: "Lead fetched successfully",
      data: lead,
    });
  } catch (error) {
    logger.error(`[GET LEAD BY ID ERROR] ${error.message}`, {
      error: error.stack,
      user: req.user?._id,
    });

    return internalServerErrorResponse(res, {
      message: "Failed to fetch lead",
      error: error.message,
    });
  }
};

export const getCustomerByPhone = async (req, res) => {
  try {
    const { _id } = req.user;
    const { phone } = req.query;
    if (!phone) {
      return badRequestResponse(res, { message: "Phone number is required" });
    }
    const garage = await GARAGE.findById(_id);
    if (!garage) {
      return badRequestResponse(res, { message: "Garage not found" });
    }
    // Check if number is blocked
    const isBlocked = await CUSTOMER_INFO.findOne({ garage_id: _id, phone });
    if (isBlocked) {
      return successResponse(res, { message: "Number is Blocked!" });
    }
    // Find user
    const user = await USER.findOne({ garage_id: _id, phone });
    const vehicle = await VEHICLE.findOne({
      garage_id: _id,
      user_id: user?._id,
    });
    return successResponse(res, {
      message: "Customer fetched successfully",
      payload: {
        user: user ? user : null,
        vehicle: vehicle ? vehicle : null,
      },
    });
  } catch (error) {
    logger.error(`[GET CUSTOMER ERROR] ${error.message}`, {
      error: error.stack,
      user: req.user?._id,
    });
    return internalServerErrorResponse(res, {
      message: "Something went wrong",
      error: error.message || "Unknown error",
    });
  }
};

export default {
  addExitLead,
  getExitLead,
  updateExitLead,
  createLead,
  updateLead,
  getLead,
  getHideLead,
  toggleLeadStatus,
  deleteLead,
  getLeadsByDateRange,
  getDropLead,
  getScheduledAppointmentDrop,
  getScheduledAppointmentWaiter,
  getVehicleDetail,
  getScheduledAppointmentPickup,
  getTransportationOptions,
  getPickupDistance,
  getLeadById,
  getCustomerByPhone,
};
