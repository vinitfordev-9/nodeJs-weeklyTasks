require("dotenv").config();

const app = require("./app");
const { sequelize } = require("./models");

const port = Number(process.env.PORT || 3000);

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("MySQL connection established.");

    return app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Unable to connect to MySQL:", error.message);
    process.exitCode = 1;
    return null;
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
