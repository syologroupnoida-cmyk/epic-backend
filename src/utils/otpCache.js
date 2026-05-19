import redis from "../config/redisClient.js";

const memoryOtpStore = new Map();

export const isDevMode = () =>
  process.env.NODE_ENV !== "production" ||
  process.env.OTP_DEV_MODE === "true";

export const DEV_OTP = process.env.OTP_DEV_CODE || "1234";

export const otpCacheGet = async (key) => {
  try {
    const value = await redis.get(key);
    if (value) return value;
  } catch (err) {
    console.error("Redis GET error:", err.message);
  }

  const entry = memoryOtpStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    memoryOtpStore.delete(key);
    return null;
  }
  return entry.otp;
};

export const otpCacheSet = async (key, otp, ttlSeconds) => {
  memoryOtpStore.set(key, {
    otp,
    expires: Date.now() + ttlSeconds * 1000,
  });

  try {
    await redis.setex(key, ttlSeconds, otp);
  } catch (err) {
    console.error("Redis SET error (memory fallback):", err.message);
  }
};

export const otpCacheDel = async (key) => {
  memoryOtpStore.delete(key);
  try {
    await redis.del(key);
  } catch (err) {
    console.error("Redis DEL error:", err.message);
  }
};

export const verifyOtpCode = async (key, otp) => {
  if (isDevMode() && String(otp) === DEV_OTP) {
    await otpCacheDel(key);
    return true;
  }

  const stored = await otpCacheGet(key);
  if (!stored) return false;
  if (stored !== String(otp)) return false;

  await otpCacheDel(key);
  return true;
};
