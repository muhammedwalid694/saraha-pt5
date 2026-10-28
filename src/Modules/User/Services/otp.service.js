import bcrypt from 'bcrypt';
import { randomInt } from 'node:crypto';
import userRepository from '../../../DB/Repositories/user.repository.js';
import { emitter } from '../../../Utils/send-email.ulils.js';
import { BadRequestError, TooManyRequestsError } from '../../../Common/Errors/index.js';

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;

export const OTP_TTL_MS = 10 * 60 * 1000;                                   // a code lives 10 minutes
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;                            // 1 code per minute per purpose
export const MAX_OTP_ATTEMPTS = Number(process.env.MAX_OTP_ATTEMPTS) || 5;  // wrong guesses before the code dies

// The keys match the sub-documents inside user.otps.
export const OtpTypes = {
  CONFIRMATION: 'confirmation',
  RESET_PASSWORD: 'resetPassword',
  LOGIN: 'login',
  ENABLE_TWO_STEP: 'enableTwoStep'
};

const EMAIL_COPY = {
  [OtpTypes.CONFIRMATION]: { subject: 'Email Confirmation', title: 'Confirm your email', text: 'Your confirmation code is' },
  [OtpTypes.RESET_PASSWORD]: { subject: 'Reset your password', title: 'Password reset', text: 'Your password reset code is' },
  [OtpTypes.LOGIN]: { subject: 'Your login verification code', title: 'Login verification', text: 'Your login code is' },
  [OtpTypes.ENABLE_TWO_STEP]: { subject: 'Enable two-step verification', title: 'Two-step verification', text: 'Your code to enable two-step verification is' }
};

const generateOtp = () => String(randomInt(100000, 1000000));

/**
 * Creates a new OTP for `type`, stores its hash on the user and returns the plain code.
 * `user` must have been loaded with `.select('+otps')` (or be a brand new document).
 * Throws 429 if a code for the same purpose was sent less than a minute ago (resend cool-down).
 */
export const issueOtp = async (user, type) => {
  const sentAt = user.otps?.[type]?.sentAt;
  if (sentAt) {
    const waitSeconds = Math.ceil((sentAt.getTime() + OTP_RESEND_COOLDOWN_MS - Date.now()) / 1000);
    if (waitSeconds > 0) {
      throw new TooManyRequestsError(`Please wait ${waitSeconds} seconds before requesting a new code`);
    }
  }

  const otp = generateOtp();
  user.set(`otps.${type}`, {
    code: await bcrypt.hash(otp, SALT_ROUNDS),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    attempts: 0,
    sentAt: new Date()
  });
  await user.save();
  return otp;
};

export const sendOtpEmail = (user, type, otp) => {
  const { subject, title, text } = EMAIL_COPY[type];
  emitter.emit('sendEmail', {
    to: user.email,
    subject,
    content: `<h2>${title}</h2>
              <p>Hi ${user.firstName},</p>
              <p>${text}: <b>${otp}</b></p>
              <p>It expires in ${OTP_TTL_MS / 60000} minutes. If this wasn't you, ignore this email.</p>`
  });
};

// issue + send in one go.
export const issueAndSendOtp = async (user, type) => {
  const otp = await issueOtp(user, type);
  sendOtpEmail(user, type, otp);
};

/**
 * Checks `otp` against the stored one.
 * - expired / missing            -> 400
 * - too many wrong guesses       -> the code is burned, 400 (request a new one)
 * - wrong code                   -> 400 + attempts left
 * - correct                      -> the code is cleared on the document (the caller must call user.save())
 */
export const verifyOtp = async (user, type, otp) => {
  const entry = user.otps?.[type];
  if (!entry?.code || !entry.expiresAt || entry.expiresAt < new Date()) {
    throw new BadRequestError('Invalid or expired code, please request a new one');
  }

  // Atomic increment so parallel requests can't squeeze in extra guesses.
  const path = `otps.${type}.attempts`;
  const updated = await userRepository
    .findOneAndUpdate({ _id: user._id, [path]: { $lt: MAX_OTP_ATTEMPTS } }, { $inc: { [path]: 1 } })
    .select('+otps');

  if (!updated) {
    await userRepository.findByIdAndUpdate(user._id, { $unset: { [`otps.${type}`]: 1 } });
    throw new BadRequestError('Too many wrong attempts, please request a new code');
  }

  if (!(await bcrypt.compare(otp, entry.code))) {
    const left = MAX_OTP_ATTEMPTS - updated.otps[type].attempts;
    throw new BadRequestError(`Invalid code (${left} attempt${left === 1 ? '' : 's'} left)`);
  }

  user.set(`otps.${type}`, undefined);
};
