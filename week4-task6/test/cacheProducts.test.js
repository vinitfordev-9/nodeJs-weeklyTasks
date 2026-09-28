jest.mock("../services/productCache", () => ({
  getProducts: jest.fn(),
}));

const productCache = require("../services/productCache");
const cacheProducts = require("../middleware/cacheProducts");

function responseDouble() {
  return {
    json: jest.fn(),
    set: jest.fn(),
    status: jest.fn().mockReturnThis(),
  };
}

describe("cacheProducts middleware", () => {
  test("serves a Redis hit without calling the database handler", async () => {
    const products = [{ id: 1, productName: "Keyboard" }];
    productCache.getProducts.mockResolvedValue({ status: "HIT", value: products });
    const res = responseDouble();
    const next = jest.fn();

    await cacheProducts({}, res, next);

    expect(res.set).toHaveBeenCalledWith("X-Cache", "HIT");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(products);
    expect(next).not.toHaveBeenCalled();
  });

  test.each(["MISS", "BYPASS"])(
    "continues to the database handler on %s",
    async (status) => {
      productCache.getProducts.mockResolvedValue({ status, value: null });
      const req = {};
      const res = responseDouble();
      const next = jest.fn();

      await cacheProducts(req, res, next);

      expect(res.set).toHaveBeenCalledWith("X-Cache", status);
      expect(req.productCacheStatus).toBe(status);
      expect(next).toHaveBeenCalledTimes(1);
    },
  );
});
