import { badRequestResponse, internalServerErrorResponse, successResponse } from "../../../middleware/responses.js";
import ISSUE_TREE from "../../../models/scheduling-tools/issueTree.js";
import CustomField from "../../../models/scheduling-tools/customField.js";
import Logger from "../../../middleware/logger.js";
const logger = new Logger("garage/scheduling-tools/issueTreeController.js");
import GARAGE from "../../../models/garage.js";
import { getPagination, sortingQuery } from "../../../utils/common.js";
import { cloneDeep } from "../../../lib/commonQueries.js";
import IssueTree, { Question, Option } from '../../../models/scheduling-tools/issueTree.js';
import mongoose from "mongoose";

// Add default categories (Popular Services and Own Services) if lists are available
const createOptionTree = async (option, issueTreeId) => {
    let nextQuestionId = null;

    if (option.next_question) {
        const nextOptions = [];

        for (const nextOpt of option.next_question.options || []) {
            const savedNextOpt = await createOptionTree(nextOpt, issueTreeId);
            nextOptions.push(savedNextOpt);
        }

        const nextQuestion = new Question({
            ...option.next_question,
            options: nextOptions.map(opt => opt._id),
            issue_tree_id: issueTreeId
        });

        await nextQuestion.save();
        nextQuestionId = nextQuestion._id;
    }

    const newOption = new Option({
        ...option,
        next_question: nextQuestionId || undefined,
        issue_tree_id: issueTreeId
    });

    await newOption.save();
    return newOption;
};

const createIssueTree = async (req, res) => {
    try {
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });

        const {
            garage_id,
            key,
            name,
            description,
            default: isDefault,
            single_page_mode,
            single_service_selection_only,
            show_as_popular,
            categories
        } = req.body;

        // Step 1: Save empty IssueTree (to get ID for child docs)
        const issueTree = new IssueTree({
            garage_id,
            key,
            name,
            description,
            default: isDefault,
            single_page_mode,
            single_service_selection_only,
            show_as_popular,
            categories: [] // we'll update later
        });

        await issueTree.save();

        const categoryDocs = [];

        // Step 2: Process and save children with issue_tree_id
        for (const cat of categories) {
            const serviceDocs = [];

            for (const svc of cat.services) {
                let questionDoc = null;

                if (svc.first_question) {
                    const options = [];

                    for (const opt of svc.first_question.options || []) {
                        const savedOpt = await createOptionTree(opt, issueTree._id);
                        options.push(savedOpt._id);
                    }

                    const question = new Question({
                        ...svc.first_question,
                        options,
                        issue_tree_id: issueTree._id
                    });

                    await question.save();
                    questionDoc = question;
                }

                const service = {
                    ...svc,
                    first_question: questionDoc?._id || null
                };

                serviceDocs.push(service);
            }

            categoryDocs.push({
                name: cat.name,
                key: cat.key,
                services: serviceDocs
            });
        }

        // Step 3: Update IssueTree with full categories
        issueTree.categories = categoryDocs;
        await issueTree.save();

        res.status(201).json({ success: true, data: issueTree });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to create Issue Tree', error: err.message });
    }
};


// ===============================

const duplicateQuestionTree = async (questionData, issueTreeId) => {
    const duplicatedOptions = [];

    for (const opt of questionData.options || []) {
        let duplicatedNextQuestion = null;

        if (opt.next_question) {
            duplicatedNextQuestion = await duplicateQuestionTree(opt.next_question, issueTreeId);
        }

        const newOption = new Option({
            option_text: opt.option_text,
            description: opt.description,
            icon: opt.icon,
            destination_type: opt.destination_type,
            comment: opt.comment,
            issue_tree_id: issueTreeId,
            next_question: duplicatedNextQuestion ? duplicatedNextQuestion._id : null,
        });

        await newOption.save();
        duplicatedOptions.push(newOption._id);
    }

    const newQuestion = new Question({
        title: questionData.title,
        footer_text: questionData.footer_text,
        auto_advance: questionData.auto_advance,
        orderOn_mobile: questionData.orderOn_mobile,
        option_button_text: questionData.option_button_text,
        issue_tree_id: issueTreeId,
        options: duplicatedOptions,
    });

    await newQuestion.save();
    return newQuestion;
};


const addDuplicateIssueTree = async (req, res) => {
    try {
        logger.log("[DUPLICATE ISSUE TREE] API Called");

        const { _id } = req.user;
        const { duplicateFromId } = req.params;
        const { key, description } = req.body;

        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });

        if (!duplicateFromId) {
            return badRequestResponse(res, { message: "duplicateFromId is required." });
        }

        // STEP 1: Fully populate questions/options with next_question chain
        const issueToDuplicate = await ISSUE_TREE.findById(duplicateFromId)
            .populate({
                path: 'categories.services.first_question',
                populate: {
                    path: 'options',
                    populate: {
                        path: 'next_question',
                        populate: {
                            path: 'options',
                            populate: {
                                path: 'next_question',
                                populate: {
                                    path: 'options',
                                    // ...extend as deeply as needed
                                }
                            }
                        }
                    }
                }
            });

        if (!issueToDuplicate) {
            return badRequestResponse(res, { message: "Issue tree to duplicate not found." });
        }

        // STEP 2: Create new issue tree (empty categories for now)
        const newIssueTree = new ISSUE_TREE({
            garage_id: _id,
            key,
            description,
            name: issueToDuplicate.name,
            default: false,
            single_page_mode: issueToDuplicate.single_page_mode,
            single_service_selection_only: issueToDuplicate.single_service_selection_only,
            show_as_popular: issueToDuplicate.show_as_popular,
            categories: [],
        });

        await newIssueTree.save();

        const newCategories = [];

        for (const cat of issueToDuplicate.categories) {
            const newServices = [];

            for (const svc of cat.services) {
                let newFirstQuestion = null;

                if (svc.first_question) {
                    newFirstQuestion = await duplicateQuestionTree(svc.first_question, newIssueTree._id);
                }

                const newService = { ...svc._doc, first_question: newFirstQuestion ? newFirstQuestion._id : null };


                newServices.push(newService);
            }

            newCategories.push({
                name: cat.name,
                key: cat.key,
                services: newServices,
            });
        }

        newIssueTree.categories = newCategories;
        await newIssueTree.save();

        return successResponse(res, {
            message: 'Issue tree duplicated successfully',
            data: newIssueTree,
        });
    } catch (error) {
        logger.error(`[DUPLICATE ISSUE TREE ERROR] ${error.message}`, { error: error.stack });
        return internalServerErrorResponse(res, {
            message: 'Failed to duplicate issue tree',
            error: error.message,
        });
    }
};


const updateIssueTreeDetails = async (req, res) => {
    try {
        logger.log("[UPDATE ISSUE TREE] API Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });
        const { key, description } = req.body;
        const { issueTreeId } = req.params;
        // Find the existing issue tree entry by ID
        const existingIssue = await ISSUE_TREE.findById(issueTreeId);
        if (!existingIssue) {
            return badRequestResponse(res, { message: "Issue tree not found" });
        }
        // Check if an issue tree with the same key already exists for this garage (if key is being updated)
        if (key && key !== existingIssue.key) {
            const duplicateIssue = await ISSUE_TREE.findOne({ garage_id: _id, key });
            if (duplicateIssue) {
                return badRequestResponse(res, { message: "An issue tree with this key already exists for this garage." });
            }
        }
        // Update fields of the existing issue tree entry
        existingIssue.key = key || existingIssue.key; // Update key if provided
        existingIssue.description = description || existingIssue.description; // Update description if provided
        // Save the updated issue tree entry to the database
        await existingIssue.save();
        return successResponse(res, { message: 'Issue tree updated successfully' });
    } catch (error) {
        logger.error(`[UPDATE ISSUE TREE ERROR] ${error.message}`, { error: error.stack });
        return internalServerErrorResponse(res, {
            message: 'Failed to update issue tree',
            error: error.message,
        });
    }
};



const getIssueTreeDetail = async (req, res) => {
    try {
        logger.log("[GET ISSUE TREE] API Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });

        const { key } = req.body;

        const matchFilter = { garage_id: _id };
        if (key) {
            matchFilter.key = { $regex: new RegExp(key, 'i') };
        }

        const issueTree = await ISSUE_TREE.aggregate([
            {
                $facet: {
                    issueTree: [
                        { $match: matchFilter },
                        {
                            $project: {
                                _id: 1,
                                garage_id: 1,
                                key: 1,
                                name: 1,
                                description: 1,
                                default: 1,
                            },
                        },
                        ...getPagination(req?.query?.page, req?.query?.limit),
                        { ...sortingQuery(req?.query?.sortBy, req?.query?.sortOrder) },
                    ],
                    total: [
                        { $match: matchFilter },
                        { $count: "total" },
                    ],
                },
            },
        ]);
        return successResponse(res, {
            message: "Issue Tree fetched successfully",
            payload: {
                issueTree: cloneDeep(issueTree)?.[0]?.issueTree ?? [],
                total: cloneDeep(issueTree)?.[0]?.total?.[0]?.total ?? 0,
            },
        });
    } catch (error) {
        logger.error(`[GET ISSUE TREE ERROR] ${error.message}`, { error: error.stack });
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
            error: error.message,
        });
    }
};

const updateDefaultIssueTree = async (req, res) => {
    try {
        logger.log("[UPDATE ISSUE TREE] API Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });
        const { issueTreeId } = req.params;
        // Find the existing issue tree entry by ID
        const existingIssue = await ISSUE_TREE.findById(issueTreeId);
        if (!existingIssue) {
            return badRequestResponse(res, { message: "Issue tree not found" });
        }
        // Set the existing issue tree's default to false
        await ISSUE_TREE.updateMany(
            { garage_id: existingIssue.garage_id, default: true },
            { $set: { default: false } }
        );

        // Set the selected issue tree's default to true
        existingIssue.default = true;

        // Save the updated issue tree entry to the database
        await existingIssue.save();
        return successResponse(res, { message: 'Issue tree updated successfully' });
    } catch (error) {
        logger.error(`[UPDATE ISSUE TREE ERROR] ${error.message}`, { error: error.stack });
        return internalServerErrorResponse(res, {
            message: 'Failed to update issue tree',
            error: error.message,
        });
    }
};

const isValidObjectId = (id) =>
    typeof id === "string" && id.length > 0 && mongoose.Types.ObjectId.isValid(id);





const updateIssueTreeService = async (req, res) => {
    try {
        logger.log("[UPDATE ISSUE TREE] API Called");

        const { _id } = req.user;
        const { issueTreeId } = req.params;
        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });

        const existingIssueTree = await ISSUE_TREE.findById(issueTreeId);
        if (!existingIssueTree)
            return badRequestResponse(res, { message: "Issue tree not found" });

        const { name, description, categories, single_page_mode, single_service_selection_only } = req.body;
        const bulkData = { questions: [], options: [] };
        const allQuestionIds = [];
        const allOptionIds = [];
        const updateQuestionTree = async (questionData, issueTreeId) => {
            let questionId;
            if (isValidObjectId(questionData._id)) {
                questionId = questionData._id;
            } else {
                questionId = new mongoose.Types.ObjectId();
            }

            const updatedOptionIds = [];
            for (const opt of questionData.options || []) {
                let optionId;
                if (isValidObjectId(opt._id)) {
                    optionId = opt._id;
                } else {
                    optionId = new mongoose.Types.ObjectId();
                }
                let updatedNextQuestionId = null;
                if (opt.next_question) {
                    updatedNextQuestionId = await updateQuestionTree(opt.next_question, issueTreeId);
                }
                const { _id: optionIdFromClient, next_question, ...optWithoutId } = opt;
                // Prepare Option bulk write
                bulkData.options.push({
                    updateOne: {
                        filter: { _id: optionId },
                        update: {
                            $set: {
                                ...optWithoutId,
                                issue_tree_id: issueTreeId,
                                next_question: updatedNextQuestionId
                            }
                        },
                        upsert: true
                    }
                });

                updatedOptionIds.push(optionId);
                allOptionIds.push(optionId);
            }
            const { _id: questionIdFromClient, options, ...questionDataWithoutId } = questionData;
            bulkData.questions.push({
                updateOne: {
                    filter: { _id: questionId },
                    update: {
                        $set: {
                            ...questionDataWithoutId,
                            issue_tree_id: issueTreeId,
                            options: updatedOptionIds
                        }
                    },
                    upsert: true
                }
            });

            allQuestionIds.push(questionId);
            return questionId;
        };

        const updatedCategories = [];

        for (const cat of categories) {
            const newServices = [];

            for (const svc of cat.services || []) {
                const { _id: svcIdFromClient, ...svcWithoutId } = svc;

                let updatedFirstQuestionId = null;
                if (svc.first_question) {
                    updatedFirstQuestionId = await updateQuestionTree(svc.first_question, issueTreeId);
                }

                const existingService = existingIssueTree.categories
                    .flatMap(c => c.services)
                    .find(s => s.key === svc.key);

                const serviceId = existingService?._id || new mongoose.Types.ObjectId();
                logger.log(`[Service] Using serviceId: ${serviceId} for service key: ${svc.key}`);

                newServices.push({
                    _id: serviceId,
                    ...svcWithoutId,
                    first_question: updatedFirstQuestionId
                });
            }

            updatedCategories.push({
                name: cat.name,
                key: cat.key,
                services: newServices
            });
        }
        await ISSUE_TREE.findByIdAndUpdate(issueTreeId, {
            name,
            description,
            categories: updatedCategories,
            single_page_mode,
            single_service_selection_only
        });
        if (bulkData.questions.length) {
            await Question.bulkWrite(bulkData.questions);
        }
        if (bulkData.options.length) {
            await Option.bulkWrite(bulkData.options);
        }
        await Promise.all([
            Question.deleteMany({ issue_tree_id: issueTreeId, _id: { $nin: allQuestionIds } }),
            Option.deleteMany({ issue_tree_id: issueTreeId, _id: { $nin: allOptionIds } })
        ]);

        return successResponse(res, { message: "Issue tree updated successfully" });
    } catch (error) {
        logger.error(`[UPDATE ISSUE TREE ERROR] ${error.message}`, { error: error.stack });
        return internalServerErrorResponse(res, {
            message: "Failed to update issue tree",
            error: error.message
        });
    }
};




const getIssueTreeServiceDetail = async (req, res) => {
    try {
        logger.log("[GET ISSUE TREE] API Called");

        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });

        const { issueTreeId } = req.params;
        const issueTree = await IssueTree.findById(issueTreeId).lean();

        if (!issueTree) {
            return res.status(404).json({ success: false, message: "Issue tree not found" });
        }

        const nestedTree = await populateNestedIssueTree(issueTree, _id);

        return successResponse(res, {
            message: "Issue tree retrieved successfully",
            payload: { existingIssue: nestedTree },
        });

    } catch (error) {
        logger.error(`[GET ISSUE TREE ERROR] ${error.message}`, { error: error.stack });
        return internalServerErrorResponse(res, {
            message: "Failed to retrieve issue tree",
            error: error.message,
        });
    }
};



const populateNestedIssueTree = async (issueTree, _id) => {
    const categories = issueTree.categories;

    // Fetch all questions and options once
    const allQuestions = await Question.find({ issue_tree_id: issueTree._id }).lean();
    const allOptions = await Option.find({ issue_tree_id: issueTree._id }).lean();
    const allCustomFields = await CustomField.find({
        garage_id: _id,
        custom_type: 'APPOINTMENT_ISSUE_TREE'
    }).lean();

    // Create map for quick lookup
    const questionMap = {};
    allQuestions.forEach(q => questionMap[q._id.toString()] = q);

    const optionMap = {};
    allOptions.forEach(o => optionMap[o._id.toString()] = o);
    const customFieldMap = {};
    allCustomFields.forEach(cf => customFieldMap[cf._id.toString()] = cf)
    const individualCustomFieldMap = {};
    allCustomFields.forEach(cfDoc => {
        (cfDoc.custom_fields || []).forEach(item => {
            individualCustomFieldMap[item._id.toString()] = item;
        });
    });

    // Build question tree recursively from map
    const buildFullQuestion = (questionId) => {
        const question = questionMap[questionId.toString()];
        if (!question) return null;
        const populatedCustomFields = (question.custom_fields || [])
            .map(cfId => individualCustomFieldMap[cfId.toString()])
            .filter(Boolean);
        const options = question.options.map(optionId => {
            const option = optionMap[optionId.toString()];
            if (!option) return null;

            return {
                ...option,
                next_question: option.next_question ? buildFullQuestion(option.next_question) : null,
            };
        }).filter(Boolean);

        return {
            ...question,
            custom_fields: populatedCustomFields,
            options,
        };
    };

    const populatedCategories = categories.map((category) => {
        const populatedServices = category.services.map((service) => {
            let fullQuestion = null;
            if (service.first_question) {
                fullQuestion = buildFullQuestion(service.first_question);
            }
            return {
                ...service,
                first_question: fullQuestion,
            };
        });

        return {
            ...category,
            services: populatedServices,
        };
    });

    return {
        ...issueTree,
        categories: populatedCategories,
    };
};

const getDefaultIssueTreeServiceDetail = async (req, res) => {
    try {
        logger.log("[GET ISSUE TREE] API Called");

        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);
        if (!garage) return badRequestResponse(res, { message: "Garage not found" });
        const issueTree = await IssueTree.findOne({ garage_id: garage._id, default: true }).lean();
        if (!issueTree) {
            return res.status(404).json({ success: false, message: "Issue tree not found" });
        }
        const nestedTree = await populateNestedIssueTree(issueTree, _id);
        return successResponse(res, {
            message: "Issue tree retrieved successfully",
            IssueTree: nestedTree,
        });
    } catch (error) {
        logger.error(`[GET ISSUE TREE ERROR] ${error.message}`, { error: error.stack });
        return internalServerErrorResponse(res, {
            message: "Failed to retrieve issue tree",
            error: error.message,
        });
    }
};

export default { createIssueTree, addDuplicateIssueTree, updateIssueTreeDetails, getIssueTreeDetail, updateDefaultIssueTree, updateIssueTreeService, getIssueTreeServiceDetail, getDefaultIssueTreeServiceDetail }




// const populateNestedIssueTree = async (issueTree) => {
//     const categories = issueTree.categories;

//     const populatedCategories = await Promise.all(
//         categories.map(async (category) => {
//             const populatedServices = await Promise.all(
//                 category.services.map(async (service) => {
//                     let fullQuestion = null;

//                     if (service.first_question) {
//                         fullQuestion = await buildFullQuestion(service.first_question, issueTree._id);
//                     }
//                     return {
//                         ...service,
//                         first_question: fullQuestion,
//                     };
//                 })
//             );

//             return {
//                 ...category,
//                 services: populatedServices,
//             };
//         })
//     );

//     return {
//         ...issueTree,
//         categories: populatedCategories,
//     };
// };
// const buildFullQuestion = async (questionId, issueTreeId) => {

//     const question = await Question.findById(questionId).lean();
//     if (!question) {
//         return null;
//     }
//     const options = await Option.find({
//         _id: { $in: question.options },
//         issue_tree_id: issueTreeId
//     }).lean();

//     const populatedOptions = await Promise.all(
//         options.map(async (option) => {
//             if (option.next_question) {
//                 const nextQuestion = await buildFullQuestion(option.next_question, issueTreeId);
//                 return {
//                     ...option,
//                     next_question: nextQuestion,
//                 };
//             }
//             return option;
//         })
//     );

//     return {
//         ...question,
//         options: populatedOptions,
//     };
// };

// const getDefaultIssueTreeServiceDetail = async (req, res) => {
//     try {
//         logger.log("[GET ISSUE TREE] API Called");

//         const { _id } = req.user;
//         const garage = await GARAGE.findById(_id);
//         if (!garage) return badRequestResponse(res, { message: "Garage not found" });
//         const issueTree = await IssueTree.findOne({ garage_id: garage._id, default: true }).lean();
//         if (!issueTree) {
//             return res.status(404).json({ success: false, message: "Issue tree not found" });
//         }
//         const nestedTree = await populateNestedIssueTree(issueTree);
//         return successResponse(res, {
//             message: "Issue tree retrieved successfully",
//             IssueTree: nestedTree,
//         });
//     } catch (error) {
//         logger.error(`[GET ISSUE TREE ERROR] ${error.message}`, { error: error.stack });
//         return internalServerErrorResponse(res, {
//             message: "Failed to retrieve issue tree",
//             error: error.message,
//         });
//     }
// };

// const updateQuestionTree = async (questionData, issueTreeId, existingIds = { questions: [], options: [] }) => {
//     let questionId = questionData._id;
//     const updatedOptionIds = [];

//     // First, process options (and their nested next_questions)
//     for (const opt of questionData.options || []) {
//         let optionId = opt._id;
//         let updatedNextQuestionId = null;

//         // Recursively update next_question if exists
//         if (opt.next_question) {
//             const result = await updateQuestionTree(opt.next_question, issueTreeId, existingIds);
//             updatedNextQuestionId = result.questionId;
//             existingIds = result.existingIds;
//         }

//         // Create or update the option
//         if (!optionId || optionId === "") {
//             const newOpt = new Option({
//                 option_text: opt.option_text,
//                 description: opt.description,
//                 icon: opt.icon,
//                 destination_type: opt.destination_type,
//                 comment: opt.comment,
//                 issue_tree_id: issueTreeId,
//                 next_question: updatedNextQuestionId,
//                 service: opt.service,
//                 popular_service: opt.popular_service,
//                 advanced_options: opt.advanced_options,
//                 issue_image: opt.issue_image,
//                 highlighted_option_text: opt.highlighted_option_text,
//                 highlighted_option_advanced_options: opt.highlighted_option_advanced_options,
//                 feature_subtitle: opt.feature_subtitle,
//                 feature_image: opt.feature_image,
//                 feature_title_image: opt.feature_title_image,
//                 bullet_points: opt.bullet_points,
//                 footer_text: opt.footer_text,
//                 feature_footer_text_advanced_options: opt.feature_footer_text_advanced_options,
//                 feature_subtitle_advanced_options: opt.feature_subtitle_advanced_options,
//                 bullet_point_advanced_options: opt.bullet_point_advanced_options,
//                 feature_button_text: opt.feature_button_text
//             });
//             await newOpt.save();
//             optionId = newOpt._id;
//         } else {
//             const existingOption = await Option.findById(optionId);
//             if (existingOption) {
//                 existingOption.option_text = opt.option_text;
//                 existingOption.description = opt.description;
//                 existingOption.icon = opt.icon;
//                 existingOption.destination_type = opt.destination_type;
//                 existingOption.comment = opt.comment;
//                 existingOption.next_question = updatedNextQuestionId;
//                 existingOption.popular_service = opt.popular_service;
//                 existingOption.service = opt.service;
//                 existingOption.advanced_options = opt.advanced_options;
//                 existingOption.issue_image = opt.issue_image;
//                 existingOption.highlighted_option_text = opt.highlighted_option_text;
//                 existingOption.highlighted_option_advanced_options = opt.highlighted_option_advanced_options;
//                 existingOption.feature_subtitle = opt.feature_subtitle;
//                 existingOption.feature_image = opt.feature_image;
//                 existingOption.feature_title_image = opt.feature_title_image;
//                 existingOption.bullet_points = opt.bullet_points;
//                 existingOption.footer_text = opt.footer_text;
//                 existingOption.feature_footer_text_advanced_options = opt.feature_footer_text_advanced_options;
//                 existingOption.feature_subtitle_advanced_options = opt.feature_subtitle_advanced_options;
//                 existingOption.bullet_point_advanced_options = opt.bullet_point_advanced_options;
//                 existingOption.feature_button_text = opt.feature_button_text;
//                 await existingOption.save();
//             }
//         }

//         updatedOptionIds.push(optionId);
//         existingIds.options.push(optionId);
//     }

//     // Now create or update the question (AFTER processing all options)
//     if (!questionId || questionId === "") {
//         const newQuestion = new Question({
//             title: questionData.title,
//             footer_text: questionData.footer_text,
//             auto_advance: questionData.auto_advance,
//             orderOn_mobile: questionData.orderOn_mobile,
//             advanced_selection: questionData.advanced_selection,
//             option_button_text: questionData.option_button_text,
//             issue_tree_id: issueTreeId,
//             options: updatedOptionIds,
//             custom_fields: questionData.custom_fields,
//             footer_advanced_options: questionData.footer_advanced_options
//         });
//         await newQuestion.save();
//         questionId = newQuestion._id;
//     } else {
//         const existingQuestion = await Question.findById(questionId);
//         if (existingQuestion) {
//             existingQuestion.title = questionData.title;
//             existingQuestion.footer_text = questionData.footer_text;
//             existingQuestion.auto_advance = questionData.auto_advance;
//             existingQuestion.orderOn_mobile = questionData.orderOn_mobile
//             existingQuestion.option_button_text = questionData.option_button_text;
//             existingQuestion.options = updatedOptionIds;
//             existingQuestion.custom_fields = questionData.custom_fields,
//                 existingQuestion.advanced_selection = questionData.advanced_selection,
//                 existingQuestion.footer_advanced_options = questionData.footer_advanced_options

//             await existingQuestion.save();
//         }
//     }

//     existingIds.questions.push(questionId);
//     return { questionId, existingIds };
// };

// const updateIssueTreeService = async (req, res) => {
//     try {
//         logger.log("[UPDATE ISSUE TREE] API Called");

//         const { _id } = req.user;
//         const { issueTreeId } = req.params;

//         const garage = await GARAGE.findById(_id);
//         if (!garage) return badRequestResponse(res, { message: "Garage not found" });

//         const existingIssueTree = await ISSUE_TREE.findById(issueTreeId);
//         if (!existingIssueTree) return badRequestResponse(res, { message: "Issue tree not found" });

//         const { name, description, categories, single_page_mode, single_service_selection_only } = req.body;

//         const updatedCategories = [];
//         const allQuestionIds = [];
//         const allOptionIds = [];

//         for (const cat of categories) {
//             const newServices = [];

//             for (const svc of cat.services || []) {
//                 let updatedFirstQuestionId = null;
//                 let existingIds = { questions: [], options: [] };

//                 if (svc.first_question) {
//                     const result = await updateQuestionTree(svc.first_question, issueTreeId, existingIds);
//                     updatedFirstQuestionId = result.questionId;
//                     existingIds = result.existingIds;
//                 }

//                 allQuestionIds.push(...existingIds.questions);
//                 allOptionIds.push(...existingIds.options);

//                 const existingService = existingIssueTree.categories.flatMap(c => c.services).find(s => s.key === svc.key);

//                 newServices.push({
//                     _id: existingService?._id || new mongoose.Types.ObjectId(),
//                     ...svc,
//                     first_question: updatedFirstQuestionId,
//                 });
//             }

//             updatedCategories.push({
//                 name: cat.name,
//                 key: cat.key,
//                 services: newServices,
//             });
//         }

//         await ISSUE_TREE.findByIdAndUpdate(issueTreeId, {
//             name,
//             description,
//             categories: updatedCategories,
//             single_page_mode,
//             single_service_selection_only,
//         });

//         await Promise.all([
//             Question.deleteMany({ issue_tree_id: issueTreeId, _id: { $nin: allQuestionIds } }),
//             Option.deleteMany({ issue_tree_id: issueTreeId, _id: { $nin: allOptionIds } }),
//         ]);

//         return successResponse(res, { message: "Issue tree updated successfully" });

//     } catch (error) {
//         logger.error(`[UPDATE ISSUE TREE ERROR] ${error.message}`, { error: error.stack });
//         return internalServerErrorResponse(res, {
//             message: "Failed to update issue tree",
//             error: error.message,
//         });
//     }
// };
