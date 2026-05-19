import SearchLog from "../models/searchlog.js";

export const trackSearch = (type) => async (req, res, next) => {
  try {
    const { search, city, minPrice, maxPrice } = req.query;

    if (!search || search.trim().length < 3) {
      return next();
    }

    const normalized = search.toLowerCase().trim();

    const sessionId =
      req.headers["x-session-id"] ||
      req.ip ||
      Math.random().toString(36).substring(2);

    const now = new Date();

    // ⏱️ 30 sec window
    const windowTime = new Date(now.getTime() - 30 * 1000);

    SearchLog.findOneAndUpdate(
      {
        normalizedQuery: normalized,
        categoryType: type,
        sessionId,
        createdAt: { $gte: windowTime }, // 👈 prevent spam in window
      },
      {
        $setOnInsert: {
          query: search,
          normalizedQuery: normalized,
          categoryType: type,
          city: city?.toLowerCase(),
          user: req.user?._id || null,
          sessionId,
          filters: { minPrice, maxPrice },
          createdAt: now,
        },
      },
      {
        upsert: true,
        new: false,
      }
    ).catch((err) =>
      console.error("Search log error:", err.message)
    );

    next();
  } catch (err) {
    next();
  }
};