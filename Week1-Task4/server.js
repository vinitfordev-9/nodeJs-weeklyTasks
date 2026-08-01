const express = require("express");

const app = express();

const noteRoutes = require("./routes/noteRoutes");

app.use(express.json());

app.use(noteRoutes);

app.get("/", (req, res) => {
  res.send("Notes API is running...");
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
