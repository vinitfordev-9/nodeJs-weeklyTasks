const redisClient = require("../config/redis");
const logger = require("../config/logger");

const PRODUCTS_CACHE_KEY = "products:all:v1";
let connectionPromise;

function isEnabled() {
  if (process.env.REDIS_CACHE_ENABLED !== undefined) {
    return process.env.REDIS_CACHE_ENABLED !== "false";
  }
  return process.env.NODE_ENV !== "test";
}

function getTtlSeconds() {
  const configuredTtl = Number(process.env.PRODUCTS_CACHE_TTL_SECONDS);
  return Number.isInteger(configuredTtl) && configuredTtl > 0
    ? configuredTtl
    : 60;
}

async function ensureConnected() {
  if (!isEnabled()) return false;
  if (redisClient.isReady) return true;

  if (!connectionPromise) {
    connectionPromise = redisClient
      .connect()
      .then(() => true)
      .catch((err) => {
        logger.warn({ err }, "Redis unavailable; bypassing product cache");
        return false;
      })
      .finally(() => {
        connectionPromise = undefined;
      });
  }

  return connectionPromise;
}

async function getProducts() {
  if (!(await ensureConnected())) {
    return { status: "BYPASS", value: null };
  }

  try {
    const cached = await redisClient.get(PRODUCTS_CACHE_KEY);
    if (cached === null) return { status: "MISS", value: null };

    try {
      return { status: "HIT", value: JSON.parse(cached) };
    } catch (err) {
      await redisClient.del(PRODUCTS_CACHE_KEY);
      logger.warn({ err, cacheKey: PRODUCTS_CACHE_KEY }, "Invalid cache entry removed");
      return { status: "MISS", value: null };
    }
  } catch (err) {
    logger.warn({ err }, "Unable to read product cache; using database");
    return { status: "BYPASS", value: null };
  }
}

async function setProducts(products) {
  if (!(await ensureConnected())) return false;

  try {
    await redisClient.set(PRODUCTS_CACHE_KEY, JSON.stringify(products), {
      EX: getTtlSeconds(),
    });
    return true;
  } catch (err) {
    logger.warn({ err }, "Unable to populate product cache");
    return false;
  }
}

async function invalidateProducts() {
  if (!(await ensureConnected())) return false;

  try {
    await redisClient.del(PRODUCTS_CACHE_KEY);
    return true;
  } catch (err) {
    logger.warn({ err }, "Unable to invalidate product cache");
    return false;
  }
}

async function close() {
  if (redisClient.isOpen) await redisClient.close();
}

module.exports = {
  PRODUCTS_CACHE_KEY,
  close,
  getProducts,
  invalidateProducts,
  setProducts,
};
