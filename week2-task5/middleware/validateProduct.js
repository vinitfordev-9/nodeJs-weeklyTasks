const Joi = require("joi");

const schema = Joi.object({
  productName: Joi.string().trim().max(100).required(),
  description: Joi.string().allow(null, "").optional(),
  price: Joi.number().positive().precision(2).required(),
  stockQuantity: Joi.number().integer().min(0).required(),
});

module.exports = function validateProduct(req, res, next) {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ message: "Validation failed", errors: error.details.map((item) => item.message) });
  req.body = value;
  return next();
};
