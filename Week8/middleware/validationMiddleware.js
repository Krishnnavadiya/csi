const Joi = require('joi');

// Validation schemas
const schemas = {
  userCreate: Joi.object({
    name: Joi.string().trim().max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('user', 'admin')
  }),
  userUpdate: Joi.object({
    name: Joi.string().trim().max(50),
    email: Joi.string().email(),
    password: Joi.string().min(6),
    role: Joi.string().valid('user', 'admin')
  }),
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  postCreate: Joi.object({
    title: Joi.string().trim().max(100).required(),
    content: Joi.string().required(),
    tags: Joi.array().items(Joi.string().trim())
  }),
  postUpdate: Joi.object({
    title: Joi.string().trim().max(100),
    content: Joi.string(),
    tags: Joi.array().items(Joi.string().trim())
  }),
  comment: Joi.object({
    text: Joi.string().required()
  })
};

// Validation middleware factory
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      throw new Error(`Schema ${schemaName} not found`);
    }

    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const validationError = new Error('Validation failed');
      validationError.statusCode = 400;
      validationError.errors = error.details.map(detail => detail.message);
      return next(validationError);
    }

    next();
  };
};

module.exports = validate;