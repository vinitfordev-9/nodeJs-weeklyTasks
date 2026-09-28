const productCache = require("../services/productCache");

async function cacheProducts(req, res, next) {
  const cached = await productCache.getProducts();
  res.set("X-Cache", cached.status);

  if (cached.status === "HIT") {
    return res.status(200).json(cached.value);
  }

  req.productCacheStatus = cached.status;
  next();
}

module.exports = cacheProducts;
