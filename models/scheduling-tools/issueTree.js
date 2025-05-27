import mongoose, { Schema } from 'mongoose';

const PopularServiceList = [
    { name: "Battery", key: 'battery' },
    { name: "Brakes", key: 'brakes' },
    { name: "Describe Your Issue", key: 'describe_your_issue' },
    { name: "Engine & Transmission", key: 'engine_transmission' },
    { name: "Heat or A/C", key: 'heat_or_A/C' },
    { name: "Vehicle Inspection", key: 'vehicle_inspection' },
    { name: "Lighting & Bulbs", key: 'lighting_bulbs' },
    { name: "Oil Change", key: 'oil_change' },
    { name: "Scheduled Maintenance", key: 'scheduled_maintenance' },
    { name: "Search Specific Part or Service", key: 'search_specific_part_or_service' },
    { name: "Tires", key: 'tires' }
];

const OwnServiceList = [
    { name: "Battery", key: 'battery' },
    { name: "Brakes", key: 'brakes' },
];

const optionSchema = new Schema({
    issue_tree_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "IssueTree"
    },
    option_text: { type: String, trim: true },
    description: { type: String, trim: true, default: '' },
    icon: { type: String, trim: true },
    destination_type: {
        type: String,
        enum: ['question', 'comments', 'elsewhere', 'end'],
        default: 'question'
    },
    service: {
        type: Schema.Types.ObjectId,
        ref: 'Service',
        default: null
    },
    popular_service: { type: Boolean, default: false },
    advanced_options: {
        description: { type: String, trim: true },
        pre_selection_key: { type: String, trim: true }
    },
    issue_image: { type: String, trim: true },
    highlighted_option_advanced_options: {
        bg_color: { type: String, trim: true },
        font_color: { type: String, trim: true }
    },
    feature_subtitle: { type: String, trim: true },
    feature_image: { type: String, trim: true },
    feature_title_image: { type: String, trim: true },
    bullet_points: { type: [String], default: [] },
    footer_text: { type: String, trim: true },
    feature_footer_text_advanced_options: {
        color: { type: String, trim: true },
        size: { type: String, trim: true },
        weight: { type: String, trim: true }
    },
    feature_subtitle_advanced_options: {
        color: { type: String, trim: true },
        size: { type: String, trim: true },
        weight: { type: String, trim: true }
    },
    bullet_point_advanced_options: {
        color: { type: String, trim: true },
        style: { type: String, trim: true },
        font_color: { type: String, trim: true },
        font_size: { type: String, trim: true },
        font_weight: { type: String, trim: true }
    },
    feature_button_text: { type: String, trim: true },

    // Parent-child linking
    parent_question: {
        type: Schema.Types.ObjectId,
        ref: 'Question'
    },
    next_question: {
        type: Schema.Types.ObjectId,
        ref: 'Question',
        default: null
    },
    comment: { type: String, trim: true }
});


const questionSchema = new Schema({
    issue_tree_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "IssueTree"
    },
    title: { type: String, trim: true },
    options: [{ type: Schema.Types.ObjectId, ref: 'Option' }],
    advanced_selection: { type: Boolean, default: false },
    custom_fields: [{ type: Schema.Types.ObjectId, ref: 'CustomField' }],
    footer_text: { type: String, trim: true },
    footer_advanced_options: {
        color: { type: String, trim: true },
        size: { type: String, trim: true },
        weight: { type: String, trim: true }
    },
    auto_advance: { type: Boolean, default: false },
    orderOn_mobile: { type: Boolean, default: false },
    option_button_text: { type: String, trim: true },
    service: {
        type: Schema.Types.ObjectId,
        ref: 'Service',
        default: null
    },
    // Linking back to parent option
    parent_option: {
        type: Schema.Types.ObjectId,
        ref: 'Option',
        default: null
    },

});


// Schema for services
const serviceSchema = new Schema({
    name: { type: String, trim: true },
    key: { type: String, trim: true },
    description: { type: String, trim: true, default: '' },
    icon: { type: String, trim: true },
    destination_type: {
        type: String,
        enum: ['question', 'comments', 'elsewhere', 'end'],
        default: 'question'
    },
    service: {
        type: Schema.Types.ObjectId,
        ref: 'Service',
        default: null
    },
    popular_services: {
        type: Boolean, default: false
    },
    advanced_options: {
        description: { type: String, trim: true },
        pre_selection_key: { type: String, trim: true }
    },
    issue_image: { type: String, trim: true },

    // Parent-child relationship
    first_question: {
        type: Schema.Types.ObjectId,
        ref: 'Question',
        default: null
    },
    comment: {
        type: String,
        trim: true
    },
    discount: {
        type: String,
        trim: true
    }
});

// Schema for categories
const categorySchema = new Schema({
    name: { type: String, trim: true },
    key: { type: String, trim: true },
    services: [serviceSchema]
});

// Main Issue Tree Schema
const issueTreeSchema = new Schema({
    garage_id: { type: Schema.Types.ObjectId, ref: 'Garage' },
    key: { type: String, trim: true },
    name: { type: String, trim: true },
    description: { type: String, trim: true, default: '' },
    default: { type: Boolean, default: false },
    single_page_mode: { type: Boolean, default: false },
    single_service_selection_only: { type: Boolean, default: false },
    show_as_popular: { type: Boolean, default: false },
    categories: {
        type: [categorySchema],
        default: function () {
            const categories = [];

            if (PopularServiceList.length) {
                categories.push({
                    name: "Popular Services",
                    key: "svc_popular_services",
                    services: PopularServiceList.map(service => ({
                        name: service.name,
                        key: `svc_${service.key}`
                    }))
                });
            }

            if (OwnServiceList.length) {
                categories.push({
                    name: "Own Services",
                    key: "svc_own_services",
                    services: OwnServiceList.map(service => ({
                        name: service.name,
                        key: `svc_${service.key}`
                    }))
                });
            }

            return categories;
        }
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Create models
const Option = mongoose.model('Option', optionSchema);
const Question = mongoose.model('Question', questionSchema);
const IssueTree = mongoose.model('IssueTree', issueTreeSchema);

export { Option, Question, IssueTree };

export default IssueTree;