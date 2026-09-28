const { getBullMqConnection } = require("../config/bullmq");

describe("BullMQ Redis configuration", () => {
  afterEach(() => {
    delete process.env.BULLMQ_REDIS_URL;
    delete process.env.REDIS_URL;
  });

  test("uses the local Redis defaults", () => {
    expect(getBullMqConnection()).toMatchObject({
      host: "127.0.0.1",
      port: 6379,
      db: 0,
      maxRetriesPerRequest: null,
    });
  });

  test("parses credentials, database, and TLS from a managed Redis URL", () => {
    process.env.BULLMQ_REDIS_URL = "rediss://queue-user:secret@redis.example:6380/4";
    expect(getBullMqConnection()).toEqual({
      host: "redis.example",
      port: 6380,
      username: "queue-user",
      password: "secret",
      db: 4,
      maxRetriesPerRequest: null,
      tls: {},
    });
  });
});
