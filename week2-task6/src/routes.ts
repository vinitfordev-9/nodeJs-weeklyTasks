import { Router } from "express";
import * as orderController from "./controllers/orderController";
import * as orderItemController from "./controllers/orderItemController";
import * as productController from "./controllers/productController";
import * as userController from "./controllers/userController";
import { asyncHandler } from "./middleware/asyncHandler";
import { orderItemSchema, orderSchema, productSchema, userSchema, validate } from "./middleware/validate";

export const router = Router();

router.get("/users", asyncHandler(userController.getAllUsers));
router.get("/users/:id", asyncHandler(userController.getUserById));
router.post("/users", validate(userSchema), asyncHandler(userController.createUser));
router.put("/users/:id", validate(userSchema), asyncHandler(userController.updateUser));
router.delete("/users/:id", asyncHandler(userController.deleteUser));

router.get("/products", asyncHandler(productController.getAllProducts));
router.get("/products/:id", asyncHandler(productController.getProductById));
router.post("/products", validate(productSchema), asyncHandler(productController.createProduct));
router.put("/products/:id", validate(productSchema), asyncHandler(productController.updateProduct));
router.delete("/products/:id", asyncHandler(productController.deleteProduct));

router.get("/orders", asyncHandler(orderController.getAllOrders));
router.get("/orders/:id", asyncHandler(orderController.getOrderById));
router.post("/orders", validate(orderSchema), asyncHandler(orderController.createOrder));
router.put("/orders/:id", validate(orderSchema), asyncHandler(orderController.updateOrder));
router.delete("/orders/:id", asyncHandler(orderController.deleteOrder));

router.get("/order-items", asyncHandler(orderItemController.getAllOrderItems));
router.get("/order-items/:id", asyncHandler(orderItemController.getOrderItemById));
router.post("/order-items", validate(orderItemSchema), asyncHandler(orderItemController.createOrderItem));
router.put("/order-items/:id", validate(orderItemSchema), asyncHandler(orderItemController.updateOrderItem));
router.delete("/order-items/:id", asyncHandler(orderItemController.deleteOrderItem));
