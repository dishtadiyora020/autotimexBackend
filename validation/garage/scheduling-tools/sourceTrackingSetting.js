import Joi from 'joi';

export const trackingFieldSchema = Joi.object({
  source: Joi.boolean(),
  marketingSource: Joi.boolean(),
  bookingPage: Joi.boolean(),
  clientReferrer: Joi.boolean(),
  gclid: Joi.boolean(),
  gcsrc: Joi.boolean(),
  fbclid: Joi.boolean(),
  wbraid: Joi.boolean(),
  gbraid: Joi.boolean(),
  yclid: Joi.boolean(),
  msclkid: Joi.boolean(),
  ttclid: Joi.boolean(),
  ao_link: Joi.boolean(),
  ao_source: Joi.boolean(),
  ao_camgaign: Joi.boolean(),
  ao_promo: Joi.boolean(),
  ao_coupon: Joi.boolean(),
  ao_affiliate: Joi.boolean(),
  ao_leadSource: Joi.boolean(),
  ao_custom_1: Joi.boolean(),
  ao_custom_2: Joi.boolean(),
  ao_custom_3: Joi.boolean(),
  utm_source: Joi.boolean(),
  utm_medium: Joi.boolean(),
  utm_campaign: Joi.boolean(),
  utm_content: Joi.boolean(),
  utm_term: Joi.boolean(),
  locationTracking: Joi.boolean(),
}).xor(
  'source', 'marketingSource', 'bookingPage', 'clientReferrer',
  'gclid', 'gcsrc', 'fbclid', 'wbraid', 'gbraid', 'yclid',
  'msclkid', 'ttclid', 'ao_link', 'ao_source', 'ao_camgaign',
  'ao_promo', 'ao_coupon', 'ao_affiliate', 'ao_leadSource',
  'ao_custom_1', 'ao_custom_2', 'ao_custom_3', 'utm_source',
  'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'locationTracking'
).messages({
  'object.xor': 'Only one tracking field can be updated at a time',
  'object.unknown': 'Invalid tracking field'
});
