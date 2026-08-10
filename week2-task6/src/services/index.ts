import { AppDataSource } from "../data-source";
import { Order } from "../entities/Order";
import { OrderItem } from "../entities/OrderItem";
import { Product } from "../entities/Product";
import { User } from "../entities/User";
import { OrderItemService } from "./OrderItemService";
import { OrderService } from "./OrderService";
import { ProductService } from "./ProductService";
import { UserService } from "./UserService";

const users = AppDataSource.getRepository(User);
const products = AppDataSource.getRepository(Product);
const orders = AppDataSource.getRepository(Order);
const orderItems = AppDataSource.getRepository(OrderItem);

export const userService = new UserService(users);
export const productService = new ProductService(products);
export const orderService = new OrderService(orders, users);
export const orderItemService = new OrderItemService(orderItems, orders, products);
