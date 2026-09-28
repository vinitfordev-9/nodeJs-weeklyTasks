jest.mock("../config/redis", () => ({
  isOpen: true,
  isReady: true,
  close: jest.fn(),
  connect: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(1),
  get: jest.fn(),
  set: jest.fn().mockResolvedValue("OK"),
}));
jest.mock("../config/logger", () => ({ warn: jest.fn() }));

const redisClient = require("../config/redis");
const productCache = require("../services/productCache");

describe("productCache", () => {
  beforeEach(() => {
    process.env.REDIS_CACHE_ENABLED = "true";
    delete process.env.PRODUCTS_CACHE_TTL_SECONDS;
    redisClient.isReady = true;
    redisClient.isOpen = true;
  });

  afterAll(() => {
    delete process.env.REDIS_CACHE_ENABLED;
    delete process.env.PRODUCTS_CACHE_TTL_SECONDS;
  });

  test("returns parsed products on a Redis hit", async () => {
    redisClient.get.mockResolvedValue('[{"id":1}]');

    await expect(productCache.getProducts()).resolves.toEqual({
      status: "HIT",
      value: [{ id: 1 }],
    });
  });

  test("reports a miss when the key does not exist", async () => {
    redisClient.get.mockResolvedValue(null);
    await expect(productCache.getProducts()).resolves.toEqual({
      status: "MISS",
      value: null,
    });
  });

  test("stores JSON with the configured TTL", async () => {
    process.env.PRODUCTS_CACHE_TTL_SECONDS = "45";
    await expect(productCache.setProducts([{ id: 2 }])).resolves.toBe(true);
    expect(redisClient.set).toHaveBeenCalledWith(
      productCache.PRODUCTS_CACHE_KEY,
      '[{"id":2}]',
      { EX: 45 },
    );
  });

  test("removes malformed cached JSON and treats it as a miss", async () => {
    redisClient.get.mockResolvedValue("not-json");
    await expect(productCache.getProducts()).resolves.toEqual({
      status: "MISS",
      value: null,
    });
    expect(redisClient.del).toHaveBeenCalledWith(productCache.PRODUCTS_CACHE_KEY);
  });

  test("deletes the product-list key during invalidation", async () => {
    await expect(productCache.invalidateProducts()).resolves.toBe(true);
    expect(redisClient.del).toHaveBeenCalledWith(productCache.PRODUCTS_CACHE_KEY);
  });

  test("fails open when Redis is disabled", async () => {
    process.env.REDIS_CACHE_ENABLED = "false";
    await expect(productCache.getProducts()).resolves.toEqual({
      status: "BYPASS",
      value: null,
    });
    expect(redisClient.get).not.toHaveBeenCalled();
  });

  test("fails open when a Redis read errors", async () => {
    redisClient.get.mockRejectedValue(new Error("Redis unavailable"));
    await expect(productCache.getProducts()).resolves.toEqual({
      status: "BYPASS",
      value: null,
    });
  });
});
