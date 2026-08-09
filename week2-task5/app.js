const express = require("express");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const orderItemRoutes = require("./routes/orderItemRoutes");
const logger = require("./middleware/logger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(express.json());
app.use(logger);

app.get("/", (req, res) => {
  res.send("E-commerce API with Sequelize and MySQL is running...");
});

app.use(userRoutes);
app.use(productRoutes);
app.use(orderRoutes);
app.use(orderItemRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
