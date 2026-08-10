import { RequestHandler } from "express";
import Joi, { ObjectSchema } from "joi";

export function validate(schema: ObjectSchema): RequestHandler {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      res.status(400).json({
        message: "Validation failed",
        errors: error.details.map((detail) => detail.message),
      });
      return;
    }
    req.validatedBody = value;
    next();
  };
}

export const userSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  email: Joi.string().trim().lowercase().email().max(100).required(),
  phone: Joi.string().trim().max(15).allow(null, "").optional(),
  address: Joi.string().trim().max(255).allow(null, "").optional(),
});

export const productSchema = Joi.object({
  productName: Joi.string().trim().max(100).required(),
  description: Joi.string().allow(null, "").optional(),
  price: Joi.number().positive().precision(2).required(),
  stockQuantity: Joi.number().integer().min(0).required(),
});

export const orderSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  orderDate: Joi.date().iso().raw().required(),
  status: Joi.string().max(50).allow(null, "").optional(),
  totalAmount: Joi.number().min(0).precision(2).allow(null).optional(),
});

export const orderItemSchema = Joi.object({
  orderId: Joi.number().integer().positive().required(),
  productId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().positive().required(),
  price: Joi.number().positive().precision(2).allow(null).optional(),
});
