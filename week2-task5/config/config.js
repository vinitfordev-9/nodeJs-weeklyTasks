require("dotenv").config();

const databaseConfig = {
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || null,
  database: process.env.DB_NAME || "week2_task5_db",
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  dialect: "mysql",
  logging: false,
};

module.exports = {
  development: databaseConfig,
  test: {
    ...databaseConfig,
    database: process.env.TEST_DB_NAME || "week2_task5_test_db",
  },
  production: databaseConfig,
};
