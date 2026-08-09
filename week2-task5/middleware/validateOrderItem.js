const Joi = require("joi");

const schema = Joi.object({
  orderId: Joi.number().integer().positive().required(),
  productId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().positive().required(),
  price: Joi.number().positive().precision(2).allow(null).optional(),
});

module.exports = function validateOrderItem(req, res, next) {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ message: "Validation failed", errors: error.details.map((item) => item.message) });
  req.body = value;
  return next();
};
