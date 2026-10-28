import { Router } from "express";
import {
  SignUpService, ConfirmEmailService, ResendConfirmationService, ListUsersService,
  SignInService, LogoutService, RefreshTokenService, SignUpServiceGmail,
  GetProfileService, UpdateAccountService, UpdatePasswordService, DeleteAccountService,
  UploadProfilePictureLocalService, UploadProfilePictureCloudService,
  VerifyTwoStepLoginService, EnableTwoStepService, ConfirmTwoStepService, DisableTwoStepService,
  ForgotPasswordService, ResetPasswordService
} from "./Services/user.service.js";
import { authenticationMiddleware } from "../../Middleware/authentication.middleware.js";
import { authorizationMiddleware } from "../../Middleware/authorization.middleware.js";
import { validationMiddleware } from "../../Middleware/validation.middleware.js";
import { authLimiter } from "../../Middleware/rate-limit.middleware.js";
import { localUpload, cloudUpload } from "../../Middleware/multer.middleware.js";
import {
  SignUpSchema, SignUpGmailSchema, SignInSchema, ConfirmEmailSchema,
  ResendConfirmationSchema, UpdateAccountSchema, UpdatePasswordSchema,
  ConfirmTwoStepSchema, DisableTwoStepSchema, VerifyTwoStepLoginSchema,
  ForgotPasswordSchema, ResetPasswordSchema
} from "../../Validators/Schemas/uaer.schema.js";
import { Privillages } from "../../Common/enums/user.enum.js";

const router = Router();

// Auth
router.post('/register', authLimiter, validationMiddleware(SignUpSchema), SignUpService)
router.put('/Confirm', authLimiter, validationMiddleware(ConfirmEmailSchema), ConfirmEmailService)
router.post('/resend-confirmation', authLimiter, validationMiddleware(ResendConfirmationSchema), ResendConfirmationService)
router.post('/login', authLimiter, validationMiddleware(SignInSchema), SignInService)
router.post('/login/verify-2step', authLimiter, validationMiddleware(VerifyTwoStepLoginSchema), VerifyTwoStepLoginService)
router.post('/refresh-token', RefreshTokenService)
router.post('/Logout', authenticationMiddleware, LogoutService)
router.post('/signup-gmail', authLimiter, validationMiddleware(SignUpGmailSchema), SignUpServiceGmail)

// Forgot & reset password (public)
router.post('/forgot-password', authLimiter, validationMiddleware(ForgotPasswordSchema), ForgotPasswordService)
router.put('/reset-password', authLimiter, validationMiddleware(ResetPasswordSchema), ResetPasswordService)

// Two-step verification (logged in)
router.post('/enable-2step', authenticationMiddleware, authLimiter, EnableTwoStepService)
router.put('/confirm-2step', authenticationMiddleware, authLimiter, validationMiddleware(ConfirmTwoStepSchema), ConfirmTwoStepService)
router.post('/disable-2step', authenticationMiddleware, authLimiter, validationMiddleware(DisableTwoStepSchema), DisableTwoStepService)

// Account
router.get('/profile', authenticationMiddleware, GetProfileService)
router.put('/update', authenticationMiddleware, validationMiddleware(UpdateAccountSchema), UpdateAccountService)
router.put('/update-password', authenticationMiddleware, validationMiddleware(UpdatePasswordSchema), UpdatePasswordService)
router.delete('/delete', authenticationMiddleware, DeleteAccountService)

// Upload files (form-data, field name: "image")
router.put('/profile-picture/local', authenticationMiddleware, localUpload.single('image'), UploadProfilePictureLocalService)
router.put('/profile-picture/cloudinary', authenticationMiddleware, cloudUpload.single('image'), UploadProfilePictureCloudService)

// Admin
router.get('/list', authenticationMiddleware, authorizationMiddleware(Privillages.ADMINS), ListUsersService)

export default router
