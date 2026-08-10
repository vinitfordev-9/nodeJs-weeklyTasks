import "reflect-metadata";
import "dotenv/config";
import { DataSource } from "typeorm";
import { Order } from "./entities/Order";
import { OrderItem } from "./entities/OrderItem";
import { Product } from "./entities/Product";
import { User } from "./entities/User";
import { CreateEcommerceSchema1723200000000 } from "./migrations/1723200000000-CreateEcommerceSchema";

export const AppDataSource = new DataSource({
  type: "sqljs",
  location: process.env.DATABASE_PATH ?? "database.sqlite",
  autoSave: true,
  logging: process.env.LOG_QUERIES === "true",
  synchronize: false,
  entities: [User, Product, Order, OrderItem],
  migrations: [CreateEcommerceSchema1723200000000],
});
