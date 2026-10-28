// "dotenv/config" MUST be the very first import so process.env is ready
// for every module that reads it.
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import userRouter from "./src/Modules/User/user.controller.js";
import messageRouter from "./src/Modules/Messages/message.controller.js";
import dbConnection from "./src/DB/db.connection.js";
import { validateEnv } from "./src/Utils/env.utils.js";
import { UPLOADS_DIR } from "./src/Utils/files.utils.js";
import { globalLimiter } from "./src/Middleware/rate-limit.middleware.js";
import { errorHandler } from "./src/Common/Errors/error-handler.js";
import { ForbiddenError, NotFoundError } from "./src/Common/Errors/index.js";

validateEnv();

const app = express();

// Behind a reverse proxy (AWS ALB / Nginx) set TRUST_PROXY=1 so rate limiting sees real IPs.
const proxyHops = Number(process.env.TRUST_PROXY);
if (proxyHops > 0) app.set("trust proxy", proxyHops);

app.use(helmet({
  referrerPolicy: { policy: "origin-when-cross-origin" },
  crossOriginResourcePolicy: { policy: "cross-origin" } // lets the front-end show /uploads images
}));

const whitelist = (process.env.WHITE_LISTED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    // No Origin header = Postman / server-to-server.
    if (!origin || whitelist.includes(origin)) return callback(null, true);
    callback(new ForbiddenError("Not allowed by CORS"));
  }
}));

app.use(globalLimiter);
app.use(express.json({ limit: "10kb" }));
app.use("/uploads", express.static(UPLOADS_DIR));

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));
app.use("/api/users", userRouter);
app.use("/api/messages", messageRouter);

app.use((req, res, next) => next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`)));
app.use(errorHandler);

try {
  await dbConnection();
} catch (error) {
  console.error("Database failed to connect:", error.message);
  process.exit(1);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
