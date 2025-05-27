import sgMail from '@sendgrid/mail'


export default {
    send: async (to, subject, text, template) => {
        try {
            sgMail.setApiKey(process.env.SENDGRID_API_KEY)
            const msg = {
                to: to,
                from: process.env.SENDGRID_SENDER,
                subject: subject,
                text: text,
                html: template,
            }
            await sgMail.send(msg)
            console.log('Email sent')
        } catch (error) {
            console.error(error)
            throw error
        }
    }
}
