import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./middleware/logger";
import { notFound } from "./middleware/notFound";
import { router } from "./routes";

export const app = express();

app.use(express.json());
app.use(logger);
app.get("/", (_req, res) => {
  res.send("E-commerce API with TypeORM, TypeScript, and repository pattern is running...");
});
app.use(router);
app.use(notFound);
app.use(errorHandler);
