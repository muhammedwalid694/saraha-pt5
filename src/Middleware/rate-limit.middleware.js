import { rateLimit } from "express-rate-limit";
import { TooManyRequestsError } from "../Common/Errors/index.js";

const make = (limit, windowMs = 15 * 60 * 1000) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (req, res, next) => next(new TooManyRequestsError())
  });

export const globalLimiter = make(300);   // every request
// register / login / confirm / resend / forgot-reset (brute-force protection).
// In dev the default is higher so you can test the whole flow in Postman; override with AUTH_RATE_LIMIT_MAX.
const authMax = Number(process.env.AUTH_RATE_LIMIT_MAX) || (process.env.NODE_ENV === "dev" ? 100 : 10);
export const authLimiter = make(authMax);
export const messageLimiter = make(30);   // anonymous message sending (spam protection)
