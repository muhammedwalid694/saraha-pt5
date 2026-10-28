import jwt from "jsonwebtoken";
import multer from "multer";
import mongoose from "mongoose";
import {
  AppError, BadRequestError, ConflictError, ForbiddenError, UnauthorizedError
} from "./app-error.js";

/**
 * Converts well-known library errors (JWT, Multer, Mongoose, body-parser, CORS)
 * into our own AppError subclasses so the client always gets a proper status
 * code and a safe message instead of a generic 500.
 */
const normalizeError = (err) => {
  if (err instanceof AppError) return err;

  if (err instanceof jwt.TokenExpiredError) return new UnauthorizedError("Token expired");
  if (err instanceof jwt.JsonWebTokenError) return new UnauthorizedError("Invalid token");

  if (err instanceof multer.MulterError) {
    return new BadRequestError(
      err.code === "LIMIT_FILE_SIZE" ? "File is too large (max 2MB)" : err.message
    );
  }

  if (err?.code === 11000) return new ConflictError("Duplicate value, this record already exists");

  if (err instanceof mongoose.Error.ValidationError) {
    const e = new BadRequestError("Validation failed");
    e.details = Object.values(err.errors).map((x) => x.message);
    return e;
  }
  if (err instanceof mongoose.Error.CastError) return new BadRequestError(`Invalid ${err.path}`);

  if (err?.type === "entity.parse.failed") return new BadRequestError("Invalid JSON body");
  if (err?.type === "entity.too.large") {
    const e = new AppError("Request body too large", 413);
    return e;
  }
  return err;
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (rawErr, req, res, next) => {
  const err = normalizeError(rawErr);
  const isOperational = err instanceof AppError;

  if (!isOperational) console.error(rawErr.stack || rawErr);

  const statusCode = isOperational ? err.statusCode : 500;
  const response = { message: isOperational ? err.message : "Something went wrong" };
  if (err.details) response.errors = err.details;
  if (process.env.NODE_ENV === "dev") response.stack = rawErr.stack;

  res.status(statusCode).json(response);
};
