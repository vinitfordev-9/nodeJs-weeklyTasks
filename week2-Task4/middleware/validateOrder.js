const Joi = require("joi");

const orderSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  orderDate: Joi.date().iso().required(),
  status: Joi.string().max(50).allow(null, "").optional(),
  totalAmount: Joi.number().min(0).precision(2).allow(null).optional(),
});

function validateOrder(req, res, next) {
  const { error, value } = orderSchema.validate(req.body, {
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

module.exports = validateOrder;
