import express from "express";
import helmet from "helmet";
import { prisma } from "./config/database.js";
import { RESPONSES, sendResponse } from "./common/responses.js";
import { errorHandler } from "./middleware/errors.js";
import { taskRouter } from "./tasks/task.routes.js";

export const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "32kb" }));
app.get("/health", async (req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  sendResponse(res, RESPONSES.HEALTHY, { data: { database: "connected" } });
});
app.use("/api/tasks", taskRouter);
app.use((req, res) => sendResponse(res, RESPONSES.ROUTE_NOT_FOUND));
app.use(errorHandler);
