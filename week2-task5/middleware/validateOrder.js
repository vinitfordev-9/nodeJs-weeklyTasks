const Joi = require("joi");

const schema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  orderDate: Joi.date().iso().required(),
  status: Joi.string().max(50).allow(null, "").optional(),
  totalAmount: Joi.number().min(0).precision(2).allow(null).optional(),
});

module.exports = function validateOrder(req, res, next) {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ message: "Validation failed", errors: error.details.map((item) => item.message) });
  req.body = value;
  return next();
};
