import { ValidationError } from "../Common/Errors/index.js";

const reqKeys = ["body", "params", "query", "headers"];

export const validationMiddleware = (schema) => {
  return (req, res, next) => {
    const validationErrors = [];

    for (const key of reqKeys) {
      if (!schema[key]) continue;

      const { error, value } = schema[key].validate(req[key], {
        abortEarly: false,
        stripUnknown: key === "body"
      });

      if (error) {
        validationErrors.push(...error.details.map((d) => d.message));
      } else if (key === "body") {
        req.body = value; // sanitized / lowercased values
      }
    }

    if (validationErrors.length) {
      throw new ValidationError("Validation failed", validationErrors);
    }

    next();
  };
};
