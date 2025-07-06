const Joi = require('joi');

const productSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(1000).allow('', null),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid('electronics', 'clothing', 'books', 'furniture', 'toys', 'grocery', 'other').required(),
  brand: Joi.string().allow('', null),
  inStock: Joi.boolean(),
  quantity: Joi.number().min(0),
  ratings: Joi.number().min(0).max(5),
  images: Joi.array().items(
    Joi.object({
      url: Joi.string().uri().required(),
      alt: Joi.string().allow('', null)
    })
  )
});

module.exports = productSchema;
