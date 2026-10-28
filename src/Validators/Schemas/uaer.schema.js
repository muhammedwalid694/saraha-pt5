import Joi from "joi";
import { GenderEnum } from "../../Common/enums/user.enum.js";

const name = Joi.string().pattern(/^\p{L}[\p{L} ]*$/u).min(2).max(20).messages({
  "string.pattern.base": "{#label} must contain letters only",
});
const email = Joi.string().email({ tlds: { allow: false }, minDomainSegments: 2 }).lowercase().trim();
const password = Joi.string()
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,64}$/)
  .messages({
    "string.pattern.base":
      "password must be 8-64 chars and include upper, lower, a number and a symbol",
  });
const phoneNumber = Joi.string().pattern(/^\+?\d{8,15}$/).messages({
  "string.pattern.base": "phoneNumber must be 8-15 digits (optional leading +)",
});

export const SignUpSchema = {
  body: Joi.object({
    firstName: name.required(),
    lastName: name.required(),
    email: email.required(),
    password: password.required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
    gender: Joi.string().valid(...Object.values(GenderEnum)).optional(),
    phoneNumber: phoneNumber.required(),
    age: Joi.number().integer().min(1).max(120).required(),
  }),
};

export const SignUpGmailSchema = {
  body: Joi.object({ idToken: Joi.string().required() }),
};

export const SignInSchema = {
  body: Joi.object({ email: email.required(), password: Joi.string().required() }),
};

export const ConfirmEmailSchema = {
  body: Joi.object({ email: email.required(), otp: Joi.string().length(6).pattern(/^\d+$/).required() }),
};

const otp = Joi.string().length(6).pattern(/^\d+$/).messages({
  "string.pattern.base": "otp must be 6 digits",
});

export const ResendConfirmationSchema = {
  body: Joi.object({ email: email.required() }),
};

export const UpdateAccountSchema = {
  body: Joi.object({
    firstName: name,
    lastName: name,
    age: Joi.number().integer().min(1).max(120),
    gender: Joi.string().valid(...Object.values(GenderEnum)),
    phoneNumber,
  }).min(1),
};

export const UpdatePasswordSchema = {
  body: Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: password.required(),
    confirmNewPassword: Joi.string().valid(Joi.ref("newPassword")).required(),
  }),
};

// ===== Two-step verification =====
export const ConfirmTwoStepSchema = {
  body: Joi.object({ otp: otp.required() }),
};

export const DisableTwoStepSchema = {
  body: Joi.object({ password: Joi.string().required() }),
};

export const VerifyTwoStepLoginSchema = {
  body: Joi.object({ email: email.required(), otp: otp.required() }),
};

// ===== Forgot / reset password =====
export const ForgotPasswordSchema = {
  body: Joi.object({ email: email.required() }),
};

export const ResetPasswordSchema = {
  body: Joi.object({
    email: email.required(),
    otp: otp.required(),
    newPassword: password.required(),
    confirmNewPassword: Joi.string().valid(Joi.ref("newPassword")).required(),
  }),
};
