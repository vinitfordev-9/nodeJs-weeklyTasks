const Joi = require("joi");

const userSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  email: Joi.string().trim().lowercase().email().max(100).required(),
  phone: Joi.string().trim().max(15).allow(null, "").optional(),
  address: Joi.string().trim().max(255).allow(null, "").optional(),
});

function validateUser(req, res, next) {
  const { error, value } = userSchema.validate(req.body, {
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
  return next();
}

module.exports = validateUser;
