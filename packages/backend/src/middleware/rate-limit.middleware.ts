import rateLimit from "express-rate-limit";

/** 5 uploads/15min per IP. */
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: "Too many uploads; try again later", code: "RATE_LIMIT_EXCEEDED" },
  standardHeaders: true,
  legacyHeaders: false,
});

/** 100 req/min per IP. */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, error: "Too many requests; try again later", code: "RATE_LIMIT_EXCEEDED" },
  standardHeaders: true,
  legacyHeaders: false,
});
