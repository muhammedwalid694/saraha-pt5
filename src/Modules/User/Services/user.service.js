import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import userRepository from '../../../DB/Repositories/user.repository.js';
import messagesRepository from '../../../DB/Repositories/messages.repository.js';
import blackListedTokensRepository from '../../../DB/Repositories/black-listed-tokens.repository.js';
import { emitter } from '../../../Utils/send-email.ulils.js';
import { issueAndSendOtp, verifyOtp, OtpTypes } from './otp.service.js';
import { encrypt, safeDecrypt } from '../../../Utils/encryption.utlis.js';
import { generateAuthTokens, generateAccessToken, verifyToken } from '../../../Utils/tokens.utils.js';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../../../Utils/cloudinary.utils.js';
import { removeLocalFile } from '../../../Utils/files.utils.js';
import { ProvidersEnum } from '../../../Common/enums/user.enum.js';
import {
  BadRequestError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError, TooManyRequestsError
} from '../../../Common/Errors/index.js';

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;
const MAX_LOGIN_ATTEMPTS = Number(process.env.MAX_LOGIN_ATTEMPTS) || 5;
const LOCK_TIME_MS = (Number(process.env.LOCK_TIME_MINUTES) || 15) * 60 * 1000;

// Public endpoints (resend / forgot) answer the same way whether or not the account exists,
// so a resend cool-down must not leak anything: it is swallowed there.
const ignoreCooldown = async (promise) => {
  try { await promise; } catch (error) { if (!(error instanceof TooManyRequestsError)) throw error; }
};

// ===== Auth: sign up / confirm / list =====
export const SignUpService = async (req, res) => {
  const { firstName, lastName, email, password, age, gender, phoneNumber } = req.body;

  // _id === email, so any provider with this email blocks a new local account.
  if (await userRepository.findById(email)) {
    throw new ConflictError("Email already exists");
  }

  const newUser = await userRepository.create({
    firstName,
    lastName,
    email,
    password: await bcrypt.hash(password, SALT_ROUNDS),
    age,
    gender,
    phoneNumber: encrypt(phoneNumber) // reversible encryption - see Utils/encryption.utlis.js
  });

  await issueAndSendOtp(newUser, OtpTypes.CONFIRMATION);

  return res.status(201).json({
    message: 'User registered successfully, check your email for the confirmation code',
    email: newUser.email
  });
};

export const ConfirmEmailService = async (req, res) => {
  const { email, otp } = req.body;

  const user = await userRepository.findOne({ email, isConfirmed: false }).select('+otps');
  if (!user) throw new BadRequestError('User not found or already confirmed');

  await verifyOtp(user, OtpTypes.CONFIRMATION, otp);
  user.isConfirmed = true;
  await user.save();

  return res.status(200).json({ message: "Confirmed" });
};

// Resend email: a new code replaces the old one (60s cool-down, see otp.service.js).
export const ResendConfirmationService = async (req, res) => {
  const { email } = req.body;
  const user = await userRepository.findOne({ email, isConfirmed: false }).select('+otps');

  // Same answer whether or not the account exists (no user enumeration).
  if (user) await ignoreCooldown(issueAndSendOtp(user, OtpTypes.CONFIRMATION));
  return res.status(200).json({
    message: "If the account exists and is not confirmed, a new code was sent (one code per minute)"
  });
};

export const ListUsersService = async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);

  const [users, total] = await Promise.all([
    userRepository.find({}, '-otps').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    userRepository.countDocuments()
  ]);

  return res.status(200).json({
    users: users.map(({ __v, ...u }) => ({ ...u, phoneNumber: safeDecrypt(u.phoneNumber) })),
    page, limit, total
  });
};

// ===== Auth: sign in / logout / refresh / google =====
// Max login attempts: after MAX_LOGIN_ATTEMPTS wrong passwords the account is locked for LOCK_TIME_MINUTES.
const lockedMessage = (lockUntil) => {
  const minutes = Math.max(Math.ceil((lockUntil.getTime() - Date.now()) / 60000), 1);
  return `Too many failed login attempts. Account locked, try again in ${minutes} minute${minutes === 1 ? '' : 's'}`;
};

const registerFailedLogin = async (user) => {
  const updated = await userRepository
    .findByIdAndUpdate(user._id, { $inc: { loginAttempts: 1 } })
    .select('+loginAttempts');

  if (updated.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
    const lockUntil = new Date(Date.now() + LOCK_TIME_MS);
    await userRepository.findByIdAndUpdate(user._id, { $set: { lockUntil, loginAttempts: 0 } });
    emitter.emit('sendEmail', {
      to: user.email,
      subject: 'Your account was temporarily locked',
      content: `<h2>Account locked</h2>
                <p>Hi ${user.firstName}, there were ${MAX_LOGIN_ATTEMPTS} failed login attempts on your account.</p>
                <p>It is locked for ${LOCK_TIME_MS / 60000} minutes. If this wasn't you, reset your password.</p>`
    });
    throw new TooManyRequestsError(lockedMessage(lockUntil));
  }

  const left = MAX_LOGIN_ATTEMPTS - updated.loginAttempts;
  throw new UnauthorizedError(`Invalid email or password (${left} attempt${left === 1 ? '' : 's'} left before the account is locked)`);
};

export const SignInService = async (req, res) => {
  const { email, password } = req.body;

  const user = await userRepository
    .findByEmail(email, ProvidersEnum.LOCAL)
    .select('+password +otps +loginAttempts +lockUntil');
  if (!user) throw new UnauthorizedError("Invalid email or password");

  // Locked? Reject BEFORE checking the password so a lock can't be brute-forced.
  if (user.lockUntil) {
    if (user.lockUntil > new Date()) throw new TooManyRequestsError(lockedMessage(user.lockUntil));
    // Lock finished -> start fresh.
    await userRepository.findByIdAndUpdate(user._id, { $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } });
  }

  if (!(await bcrypt.compare(password, user.password))) {
    await registerFailedLogin(user); // always throws
  }

  // Correct password -> reset the counter.
  if (user.loginAttempts || user.lockUntil) {
    await userRepository.findByIdAndUpdate(user._id, { $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } });
  }

  if (!user.isConfirmed) {
    throw new ForbiddenError("Please confirm your email first");
  }

  // Two-step verification: no tokens yet, a code is e-mailed and must be sent to /login/verify-2step.
  // (Calling login again = "resend code", subject to the 60s cool-down.)
  if (user.twoStepEnabled) {
    await issueAndSendOtp(user, OtpTypes.LOGIN);
    return res.status(200).json({
      message: "Verification code sent to your email, send it to /api/users/login/verify-2step",
      twoStepRequired: true,
      email: user.email
    });
  }

  return res.status(200).json({
    message: "User signed in successfully",
    user,                          // password / otps are removed by the model's toJSON
    ...generateAuthTokens(user)
  });
};

// 2nd step of login when two-step verification is enabled.
export const VerifyTwoStepLoginService = async (req, res) => {
  const { email, otp } = req.body;

  const user = await userRepository.findByEmail(email, ProvidersEnum.LOCAL).select('+otps');
  if (!user || !user.twoStepEnabled) throw new BadRequestError('Invalid or expired code, please request a new one');

  await verifyOtp(user, OtpTypes.LOGIN, otp);
  await user.save();

  return res.status(200).json({
    message: "User signed in successfully",
    user,
    ...generateAuthTokens(user)
  });
};

// ===== Two-step verification: enable / confirm / disable =====
const loadLocalUser = async (_id) => {
  const user = await userRepository.findById(_id).select('+password +otps');
  if (!user) throw new NotFoundError("User not found");
  if (user.provider !== ProvidersEnum.LOCAL) {
    throw new BadRequestError("Accounts created with Google are protected by Google's own verification");
  }
  return user;
};

export const EnableTwoStepService = async (req, res) => {
  const user = await loadLocalUser(req.loggedInUser.user._id);
  if (user.twoStepEnabled) throw new ConflictError("Two-step verification is already enabled");

  await issueAndSendOtp(user, OtpTypes.ENABLE_TWO_STEP);
  return res.status(200).json({ message: "Verification code sent to your email, confirm it to enable two-step verification" });
};

export const ConfirmTwoStepService = async (req, res) => {
  const user = await loadLocalUser(req.loggedInUser.user._id);
  if (user.twoStepEnabled) throw new ConflictError("Two-step verification is already enabled");

  await verifyOtp(user, OtpTypes.ENABLE_TWO_STEP, req.body.otp);
  user.twoStepEnabled = true;
  await user.save();

  return res.status(200).json({ message: "Two-step verification enabled" });
};

export const DisableTwoStepService = async (req, res) => {
  const user = await loadLocalUser(req.loggedInUser.user._id);
  if (!user.twoStepEnabled) throw new BadRequestError("Two-step verification is not enabled");
  if (!(await bcrypt.compare(req.body.password, user.password))) {
    throw new BadRequestError("Password is incorrect");
  }

  user.twoStepEnabled = false;
  user.set('otps.login', undefined);
  await user.save();

  return res.status(200).json({ message: "Two-step verification disabled" });
};

// ===== Forgot / reset password =====
export const ForgotPasswordService = async (req, res) => {
  const { email } = req.body;
  const user = await userRepository
    .findOne({ email, provider: ProvidersEnum.LOCAL, isConfirmed: true })
    .select('+otps');

  // Same answer whether or not the account exists (no user enumeration).
  if (user) await ignoreCooldown(issueAndSendOtp(user, OtpTypes.RESET_PASSWORD));
  return res.status(200).json({
    message: "If the account exists, a password reset code was sent to its email (one code per minute)"
  });
};

export const ResetPasswordService = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await userRepository
    .findOne({ email, provider: ProvidersEnum.LOCAL, isConfirmed: true })
    .select('+password +otps +loginAttempts +lockUntil');
  if (!user) throw new BadRequestError('Invalid or expired code, please request a new one');

  await verifyOtp(user, OtpTypes.RESET_PASSWORD, otp);

  user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.credentialsChangedAt = new Date(); // revokes every token issued before now
  user.loginAttempts = 0;                 // a successful reset also unlocks the account
  user.lockUntil = undefined;
  await user.save();

  emitter.emit('sendEmail', {
    to: user.email,
    subject: 'Your password was changed',
    content: `<h2>Password changed</h2><p>Hi ${user.firstName}, your password was just reset. If this wasn't you, contact support immediately.</p>`
  });

  return res.status(200).json({ message: "Password reset successfully, please log in with your new password" });
};

export const LogoutService = async (req, res) => {
  const { token: { tokenId, expirationDate }, user: { _id } } = req.loggedInUser;

  // exp is in seconds -> multiply by 1000 for Date().
  const entries = [{ tokenId, expirationDate: new Date(expirationDate * 1000), userId: _id }];

  // Optionally revoke the refresh token too (header: refreshtoken).
  const { refreshtoken } = req.headers;
  if (refreshtoken) {
    try {
      const decoded = verifyToken(refreshtoken, process.env.JWT_REFRESH_SECRET);
      if (decoded.jti && decoded._id === _id) {
        entries.push({ tokenId: decoded.jti, expirationDate: new Date(decoded.exp * 1000), userId: _id });
      }
    } catch { /* an invalid refresh token has nothing to revoke */ }
  }

  await blackListedTokensRepository.create(entries);
  return res.status(200).json({ message: "User logged out successfully" });
};

export const RefreshTokenService = async (req, res) => {
  // Node always lowercases incoming header names.
  const { refreshtoken } = req.headers;
  if (!refreshtoken) throw new UnauthorizedError("Please provide a refresh token");

  const decoded = verifyToken(refreshtoken, process.env.JWT_REFRESH_SECRET);

  if (await blackListedTokensRepository.findByTokenId(decoded.jti)) {
    throw new UnauthorizedError("Token is blacklisted");
  }

  const user = await userRepository.findById(decoded._id).lean();
  if (!user) throw new UnauthorizedError("User no longer exists");
  if (user.credentialsChangedAt &&
      decoded.iat < Math.floor(user.credentialsChangedAt.getTime() / 1000)) {
    throw new UnauthorizedError("Credentials changed, please log in again");
  }

  return res.status(200).json({
    message: "User token is refreshed successfully",
    accessToken: generateAccessToken(user)
  });
};

export const SignUpServiceGmail = async (req, res) => {
  const { idToken } = req.body;

  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({ idToken, audience: process.env.WEB_CLIENT_ID });

  const payload = ticket.getPayload();
  const { given_name, family_name, email_verified, sub } = payload;
  const email = payload.email?.toLowerCase();
  if (!email || !email_verified) throw new BadRequestError("Email is not verified");

  let user = await userRepository.findByGoogleSub(sub, ProvidersEnum.GOOGLE);

  if (!user) {
    // _id === email, so a password account with the same email must not be hijacked.
    if (await userRepository.findById(email)) {
      throw new ConflictError("This email is already registered. Please log in with your email and password");
    }
    user = await userRepository.create({
      firstName: (given_name || email.split('@')[0]).slice(0, 20),
      lastName: family_name ? family_name.slice(0, 20) : undefined,
      email,
      provider: ProvidersEnum.GOOGLE,
      isConfirmed: true,
      GoogleSub: sub
    });
  }

  return res.status(200).json({
    message: "User signed in with Google successfully",
    user,
    ...generateAuthTokens(user)
  });
};

// ===== Account: profile / update / password / delete =====
export const GetProfileService = async (req, res) => {
  const { password, otps, __v, ...user } = req.loggedInUser.user;
  return res.status(200).json({ user: { ...user, phoneNumber: safeDecrypt(user.phoneNumber) } });
};

export const UpdateAccountService = async (req, res) => {
  const { _id } = req.loggedInUser.user;
  const update = { ...req.body };
  if (update.phoneNumber) update.phoneNumber = encrypt(update.phoneNumber);

  // Only whitelisted fields reach this point (email / role / password cannot be changed here).
  const updatedUser = await userRepository.findByIdAndUpdate(_id, update, { new: true, runValidators: true });
  if (!updatedUser) throw new NotFoundError("User not found");

  return res.status(200).json({ message: "User updated successfully", user: updatedUser });
};

export const UpdatePasswordService = async (req, res) => {
  const { _id } = req.loggedInUser.user;
  const { oldPassword, newPassword } = req.body;

  const user = await userRepository.findById(_id).select('+password');
  if (!user) throw new NotFoundError("User not found");
  if (user.provider !== ProvidersEnum.LOCAL) {
    throw new BadRequestError("Accounts created with Google have no password");
  }
  if (!(await bcrypt.compare(oldPassword, user.password))) {
    throw new BadRequestError("Old password is incorrect");
  }

  user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.credentialsChangedAt = new Date(); // revokes every token issued before now
  await user.save();

  return res.status(200).json({ message: "Password updated successfully, please log in again" });
};

export const DeleteAccountService = async (req, res) => {
  const { _id, profilePicture } = req.loggedInUser.user;

  const deletedUser = await userRepository.findByIdAndDelete(_id);
  if (!deletedUser) throw new NotFoundError("User not found");

  await messagesRepository.deleteMany({ receiverId: _id });
  await removePicture(profilePicture);

  return res.status(200).json({ message: "User deleted successfully" });
};

// ===== Upload files [local - cloudinary] =====
const removePicture = async (picture) => {
  if (!picture) return;
  if (picture.storage === 'cloudinary') await deleteFromCloudinary(picture.publicId);
  else await removeLocalFile(picture.url);
};

export const UploadProfilePictureLocalService = async (req, res) => {
  if (!req.file) throw new BadRequestError('Please upload an image in the "image" field');
  const { _id, profilePicture: oldPicture } = req.loggedInUser.user;

  const picture = { url: `/uploads/profile/${req.file.filename}`, storage: 'local' };
  try {
    await userRepository.findByIdAndUpdate(_id, { profilePicture: picture });
  } catch (error) {
    await removeLocalFile(picture.url); // don't leave an orphan file behind
    throw error;
  }
  await removePicture(oldPicture);

  return res.status(200).json({ message: "Profile picture uploaded successfully", profilePicture: picture });
};

export const UploadProfilePictureCloudService = async (req, res) => {
  if (!req.file) throw new BadRequestError('Please upload an image in the "image" field');
  const { _id, profilePicture: oldPicture } = req.loggedInUser.user;

  const result = await uploadBufferToCloudinary(req.file.buffer);
  const picture = { url: result.secure_url, publicId: result.public_id, storage: 'cloudinary' };
  try {
    await userRepository.findByIdAndUpdate(_id, { profilePicture: picture });
  } catch (error) {
    await deleteFromCloudinary(picture.publicId);
    throw error;
  }
  await removePicture(oldPicture);

  return res.status(200).json({ message: "Profile picture uploaded successfully", profilePicture: picture });
};
