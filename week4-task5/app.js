require("dotenv").config({ quiet: true });

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
const { corsMiddleware, securityHeaders } = require("./config/security");
const { sanitizeInput } = require("./middleware/sanitizeInput");

const app = express();

// Assign the correlation ID before any middleware can reject the request.
app.use(logger);
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(express.json({ limit: "100kb" }));
app.use(sanitizeInput);

app.get("/", (req, res) => {
  res.send("E-commerce API is running...");
});

app.use("/live", express.static(require("path").join(__dirname, "public")));

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
