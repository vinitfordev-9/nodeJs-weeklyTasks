const Joi = require("joi");

const productSchema = Joi.object({
  productName: Joi.string().max(100).required(),
  description: Joi.string().allow(null, "").optional(),
  price: Joi.number().positive().precision(2).required(),
  stockQuantity: Joi.number().integer().min(0).required(),
});

function validateProduct(req, res, next) {
  const { error, value } = productSchema.validate(req.body, {
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
}

module.exports = validateProduct;
