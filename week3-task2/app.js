require("dotenv").config();

const express = require("express");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const orderItemRoutes = require("./routes/orderItemRoutes");
const authenticateToken = require("./middleware/authenticateToken");
const logger = require("./middleware/logger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(express.json());
app.use(logger);

app.get("/", (req, res) => {
  res.send("E-commerce API is running...");
});

app.use(authRoutes);

// Every business-data endpoint below this line requires a valid JWT.
app.use(authenticateToken);
app.use(userRoutes);
app.use(productRoutes);
app.use(orderRoutes);
app.use(orderItemRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
