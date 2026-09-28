const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  email: Joi.string().trim().lowercase().email().max(100).required(),
  password: Joi.string().min(8).max(72).required(),
  phone: Joi.string().max(15).allow(null, "").optional(),
  address: Joi.string().max(255).allow(null, "").optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().max(100).required(),
  password: Joi.string().max(72).required(),
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
  validateLogin: validate(loginSchema),
  validateRegister: validate(registerSchema),
};
