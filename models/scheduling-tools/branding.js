import mongoose, { Schema } from 'mongoose';

const brandingSchema = new Schema({
    garage_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Garage',
    },
    colors: {
        button_color: {
            type: String,
            validate: {
                validator: function (v) {
                    return !v || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
                },
                message: props => `${props.value} is not a valid hex color!`
            }
        },
        text_color: {
            type: String,
            validate: {
                validator: function (v) {
                    return !v || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
                },
                message: props => `${props.value} is not a valid hex color!`
            }
        },
        icon_color: {
            type: String,
            validate: {
                validator: function (v) {
                    return !v || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
                },
                message: props => `${props.value} is not a valid hex color!`
            }
        },
        button_text_color: {
            type: String,
            validate: {
                validator: function (v) {
                    return !v || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
                },
                message: props => `${props.value} is not a valid hex color!`
            }
        },
        border_color: {
            type: String,
            validate: {
                validator: function (v) {
                    return !v || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
                },
                message: props => `${props.value} is not a valid hex color!`
            }
        },
        theme_color: {
            type: String,
            validate: {
                validator: function (v) {
                    return !v || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
                },
                message: props => `${props.value} is not a valid hex color!`
            }
        }
    },
    images: {
        logo: {
            type: String,
            trim: true
        },
        is_header_show: {
            type: Boolean,
            default: false
        },
        header_image: {
            type: String,
            trim: true
        }
    },
    scheduler_titles: {
        service_selection: {
            header: {
                type: String,
                trim: true
            }
        },
        customer_phone_page: {
            header: {
                type: String,
                trim: true
            },
            primary_subtitle: {
                type: String,
                trim: true
            },
            secondary_subtitle: {
                type: String,
                trim: true
            }
        },
        phone_verification_page: {
            header: {
                type: String,
                trim: true
            },
            subtitle: {
                type: String,
                trim: true
            }
        },
        new_customer_info_page: {
            header: {
                type: String,
                trim: true
            },
            subtitle: {
                type: String,
                trim: true
            }
        },
        vehicle_select_page: {
            header: {
                type: String,
                trim: true
            },
            primary_subtitle: {
                type: String,
                trim: true
            },
            secondary_subtitle: {
                type: String,
                trim: true
            }
        },
        new_vehicle_page: {
            subtitle: {
                type: String,
                trim: true
            }
        },
        deferred_work_page: {
            header: {
                type: String,
                trim: true
            }
        },
        drop_waiter_pickup_page: {
            header: {
                type: String,
                trim: true
            },
            subtitle: {
                type: String,
                trim: true
            }
        },
        schedule_page: {
            header: {
                type: String,
                trim: true
            }
        },
        transportation_req_page: {
            header: {
                type: String,
                trim: true
            },
            subtitle: {
                type: String,
                trim: true
            }
        },
        customer_address_page: {
            header: {
                type: String,
                trim: true
            }
        },
        confirmation_page: {
            header: {
                type: String,
                trim: true
            }
        },
        success_page: {
            header: {
                type: String,
                trim: true
            }
        }
    }
});
brandingSchema.index({ garage_id: 1 }, { unique: true });
const Branding = mongoose.model('Branding', brandingSchema);

export default Branding;