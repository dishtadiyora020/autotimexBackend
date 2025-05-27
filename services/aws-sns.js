import AWS from 'aws-sdk';

AWS.config.update({
    accessKeyId: process.env.SMS_ACCESS_KEY,
    secretAccessKey: process.env.SMS_SECRET_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
});

const sns = new AWS.SNS();

export function sendSMS(phoneNumber, message) {
  const params = {
    Message: message,
    PhoneNumber: phoneNumber,
  };

  return sns.publish(params).promise()
    .then(data => {
      console.log("SMS sent successfully:", data);
      return data;
    })
    .catch(err => {
      console.error("Error sending SMS:", err);
      throw err;
    });
}
