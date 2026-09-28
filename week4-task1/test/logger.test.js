const express = require("express");
const request = require("supertest");

const requestLogger = require("../middleware/logger");

describe("structured request logging", () => {
  const app = express();

  app.use(requestLogger);
  app.get("/request-id", (req, res) => {
    res.json(req.log.bindings());
  });

  test("generates a UUID request ID and binds it to the request logger", async () => {
    const response = await request(app).get("/request-id").expect(200);

    expect(response.headers["x-request-id"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(response.body.requestId).toBe(response.headers["x-request-id"]);
  });

  test("assigns a unique ID to every incoming request", async () => {
    const first = await request(app).get("/request-id");
    const second = await request(app).get("/request-id");

    expect(first.headers["x-request-id"]).not.toBe(
      second.headers["x-request-id"],
    );
  });
});
