import Joi from "joi"

export const updateNotificationSettingsSchema = Joi.object({
    email_notifications: Joi.object({
        new_appointment_emails: Joi.array().items(Joi.string().email()),
        new_lead_emails: Joi.array().items(Joi.string().email()),
        is_send_email_alerts: Joi.boolean(),
        is_add_appointment_detail_subject: Joi.boolean(),
        is_send_to_admin_when_book_internally: Joi.boolean()
    }),
    notifications: Joi.array().items({
        type: Joi.string().trim(),
        waiter: Joi.string().trim(),
        dropoff: Joi.string().trim(),
        pickup: Joi.string().trim()
    })
})


export const updateAppointmentFromNotificationSchema = Joi.object({
    color_option: Joi.string().optional().label("Color Option"),
    start_time: Joi.date().iso().optional().label("Start Time"),
    end_time: Joi.date().iso().optional().label("End Time"),
    service_advisor: Joi.string().optional().allow("").label("Service Advisor"),
    service_advisor_notes: Joi.string().allow("").optional().label("Service Advisor Notes"),
    progress_percentage: Joi.string().optional().allow("").label("Progress Percentage"),
    technician: Joi.string().optional().allow("").label("Technician"),
    job_label: Joi.array().items(Joi.string().label("Job Label Id")).optional().label("Job Label"),
    is_arrived: Joi.boolean().optional().label("Is Arrived")
});