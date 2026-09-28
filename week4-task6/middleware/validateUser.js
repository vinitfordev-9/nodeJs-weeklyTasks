const Joi = require("joi");

const baseFields = {
  name: Joi.string().max(100).required(),
  email: Joi.string().lowercase().email().max(100).required(),
  phone: Joi.string().max(15).allow(null, "").optional(),
  address: Joi.string().max(255).allow(null, "").optional(),
  role: Joi.string().valid("USER", "ADMIN").default("USER"),
};

const createUserSchema = Joi.object({
  ...baseFields,
  password: Joi.string().min(8).max(72).required(),
});

const updateUserSchema = Joi.object({
  ...baseFields,
  role: Joi.string().valid("USER", "ADMIN").optional(),
  password: Joi.string().min(8).max(72).optional(),
});

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.details.map((detail) => detail.message),
      });
    }

    req.body = value;
    next();
  };
}

module.exports = {
  validateCreateUser: validate(createUserSchema),
  validateUpdateUser: validate(updateUserSchema),
};
