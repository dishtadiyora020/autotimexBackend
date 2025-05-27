import { writeBufferToFile } from "../../../middleware/fileUploadHandler.js";
import Logger from "../../../middleware/logger.js";
import { badRequestResponse, internalServerErrorResponse, successResponse } from "../../../middleware/responses.js";
const logger = new Logger("garage/scheduling-tools/transportationOptionsController.js");
import GARAGE from "../../../models/garage.js";
import BRANDING from "../../../models/scheduling-tools/branding.js";

const createOrUpdateBrandingColors = async (req, res) => {
    try {
        logger.log("[UPDATE BRANDING COLORS] API Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);
        if (!garage) {
            return badRequestResponse(res, { message: "Garage not found" });
        }
        const updateData = req.body.colors;
        const updatedBranding = await BRANDING.updateOne(
            { garage_id: _id },
            { $set: { colors: updateData } },
            { upsert: true, new: true }
        );
        return successResponse(res, {
            message: 'Branding colors updated successfully',
        });
    } catch (error) {
        logger.error(`[UPDATE BRANDING COLORS ERROR] ${error.message}`, { error });
        return internalServerErrorResponse(res, {
            message: 'Failed to update branding colors',
            error: error.message,
        });
    }
};

const getBranding = async (req, res) => {
    try {
        logger.log("[GET BRANDING COLORS]  Api Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })

        let Branding = await BRANDING.findOne({ garage_id: _id });

        return successResponse(res, {
            message: "Success Branding Color fetched successfully",
            payload: {
                Branding
            },
        });
    } catch (error) {
        logger.error(error);
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
        });
    }
};

//add image
const createOrUpdateBrandingImage = async (req, res) => {
    try {
        logger.log("[UPDATE BRANDING IMAGES] API Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);
        if (!garage) {
            return badRequestResponse(res, { message: "Garage not found" });
        }
        const existingBranding = await BRANDING.findOne({ garage_id: _id });

        let logoUrl = existingBranding?.images?.logo || null;
        let headerImageUrl = existingBranding?.images?.header_image || null;
        // Handle logo upload
        if (req.files?.['logo']?.[0]) {
            const logoFile = req.files['logo'][0];
            try {
                logoUrl = await writeBufferToFile(
                    logoFile.buffer,
                    'branding/logos',
                    logoFile.originalname
                );
            } catch (error) {
                logger.error(`Error writing logo to file: ${error.message}`);
                logoUrl = null;
            }
        }
        // Handle header image upload
        if (req.files?.['header_image']?.[0]) {
            const headerImage = req.files['header_image'][0];
            try {
                headerImageUrl = await writeBufferToFile(
                    headerImage.buffer,
                    'branding/headers',
                    headerImage.originalname
                );
                logger.log(`Header Image URL: ${headerImageUrl}`);
            } catch (error) {
                logger.error(`Error writing header image to file: ${error.message}`);
                headerImageUrl = null;
            }
        }
        const updateData = {
            images: {
                logo: logoUrl || null,
                header_image: headerImageUrl || null,
                is_header_show: req.body.is_header_show === 'true'
            }
        };
        await BRANDING.updateOne(
            { garage_id: _id },
            { $set: updateData },
            { upsert: true, runValidators: true }
        );
        const updatedBranding = await BRANDING.findOne({ garage_id: _id });

        return successResponse(res, {
            message: 'Branding images updated successfully',
        });

    } catch (error) {
        logger.error(`[UPDATE BRANDING IMAGES ERROR] ${error.message}`, { error });
        return internalServerErrorResponse(res, {
            message: 'Failed to update branding images',
            error: error.message,
        });
    }
};

const getBrandingImage = async (req, res) => {
    try {
        logger.log("[GET BRANDING IMAGES]  Api Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })

        let BrandingImage = await BRANDING.findOne({ garage_id: _id });

        return successResponse(res, {
            message: "Success Branding image fetched successfully",
            payload: {
                images: BrandingImage.images
            },
        });
    } catch (error) {
        logger.error(error);
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
        });
    }
};

//add title
const createOrUpdateBrandingTitles = async (req, res) => {
    try {
        logger.log("[UPDATE BRANDING TITLES] API Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id);

        if (!garage) {
            return badRequestResponse(res, { message: "Garage not found" });
        }

        const updateData = req.body.scheduler_titles;

        const updatedBranding = await BRANDING.updateOne(
            { garage_id: _id },
            { $set: { scheduler_titles: updateData } },
            { upsert: true, new: true }
        );

        return successResponse(res, {
            message: 'Branding titles updated successfully',
        });
    } catch (error) {
        logger.error(`[UPDATE BRANDING TITLES ERROR] ${error.message}`, { error });
        return internalServerErrorResponse(res, {
            message: 'Failed to update branding titles',
            error: error.message,
        });
    }
};

const getBrandingTitle = async (req, res) => {
    try {
        logger.log("[GET BRANDING TITLES]  Api Called");
        const { _id } = req.user;
        const garage = await GARAGE.findById(_id)
        if (!garage) return badRequestResponse(res, { message: "Garage not found" })

        let BrandingTitle = await BRANDING.findOne({ garage_id: _id });

        return successResponse(res, {
            message: "Success Branding Title fetched successfully",
            payload: {
                schedulerTitle: BrandingTitle.scheduler_titles
            },
        });
    } catch (error) {
        logger.error(error);
        return internalServerErrorResponse(res, {
            message: "Something went wrong",
        });
    }
};

const updateBranding = async (req, res) => {
    try {
        logger.log("[UPDATE BRANDING] API Called");

        const { _id } = req.user;

        // Validate garage
        const garage = await GARAGE.findById(_id);
        if (!garage) {
            return badRequestResponse(res, { message: "Garage not found" });
        }

        const updateFields = {};

        // Parse and assign colors
        if (req.body.colors) {
            updateFields.colors = req.body.colors;
        }

        // Parse and assign scheduler titles
        if (req.body.scheduler_titles) {
            updateFields.scheduler_titles = req.body.scheduler_titles;
        }

        // Get existing branding record (if any)
        // const existingBranding = await BRANDING.findOne({ garage_id: _id });

        let logoUrl = (req.body?.images?.logo !== null && req.body?.images?.logo !== "null") ? req.body?.images?.logo : null;
        let headerImageUrl = (req.body?.images?.header_image !== null && req.body?.images?.header_image !== "null") ? req.body.images.header_image : null;

        // Handle logo file upload
        if (req.files?.['logo']?.[0]) {
            const logoFile = req.files['logo'][0];
            try {
                logoUrl = await writeBufferToFile(
                    logoFile.buffer,
                    `${garage._id}/branding/logos`,
                    logoFile.originalname
                );
            } catch (error) {
                logger.error(`Error writing logo to file: ${error.message}`);
            }
        }

        // Handle header image file upload
        if (req.files?.['header_image']?.[0]) {
            const headerImage = req.files['header_image'][0];
            try {
                headerImageUrl = await writeBufferToFile(
                    headerImage.buffer,
                    `${garage._id}branding/headers`,
                    headerImage.originalname
                );
            } catch (error) {
                logger.error(`Error writing header image to file: ${error.message}`);
            }
        }

        updateFields.images = {
            logo: logoUrl,
            header_image: headerImageUrl,
            is_header_show: req.body.images?.is_header_show === 'true'
        };

        // Save branding data (upsert)
        await BRANDING.updateOne(
            { garage_id: _id },
            { $set: updateFields },
            { upsert: true, runValidators: true }
        );

        return successResponse(res, {
            message: 'Branding updated successfully',
        });

    } catch (error) {
        logger.error(`[UPDATE BRANDING ERROR] ${error.message}`, { error });
        return internalServerErrorResponse(res, {
            message: 'Failed to update branding',
            error: error.message,
        });
    }
};



export default { createOrUpdateBrandingColors, getBranding, createOrUpdateBrandingImage, createOrUpdateBrandingTitles, updateBranding };
