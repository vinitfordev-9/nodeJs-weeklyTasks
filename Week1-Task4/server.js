const express = require("express");

const app = express();

const noteRoutes = require("./routes/noteRoutes");
const logger = require("./middleware/logger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

app.use(express.json());
app.use(logger);

app.get("/", (req, res) => {
  console.log("testing");
  res.send("Notes API is running...");
});
app.use(noteRoutes);
app.use(notFound);
app.use(errorHandler);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
