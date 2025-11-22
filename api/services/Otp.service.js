import jwt from 'jsonwebtoken';
import { sendVerificationEmail } from './Email/Email.service.js';
import { getOtp, saveOTP, deleteOtp } from '#repositories/Otp.repository.js';

const OTP_TTL_SECONDS = 5 * 60; // 5 minutes

const TOKEN_EXPIRES_IN_MINUTES = 5;

const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) {
  throw new Error('SECRET_KEY env var is required');
}

/**
 * Generate a 5 digit numeric OTP as a string.
 */
function generateOtp() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

export async function generateOtpForEmail(email, name, purpose) {
  const code = generateOtp();
  const now = Math.floor(Date.now() / 1000); // seconds
  const ttl = now + OTP_TTL_SECONDS;

  await saveOTP(email, name, code, ttl, purpose);

  await sendVerificationEmail({
    to: email,
    name,
    code,
  });
}

// This function returns a short lived JWT if OTP is valid
export async function verifyOtpForEmail(email, code, purpose) {
  const record = await getOtp(email, code, purpose);

  if (!record) {
    const e = new Error('Invalid code for email');
    e.code = 'INVALID_CODE';
    throw e;
  }

  const now = Math.floor(Date.now() / 1000);

  if (record.ttl && record.ttl < now) {
    // Expired based on TTL
    // Optionally clean up

    await deleteOtp(email, code, purpose);

    const e = new Error('Code has expired');
    e.code = 'CODE_EXPIRED';
    throw e;
  }

  // OTP is valid, delete it so it cannot be reused
  await deleteOtp(email, code, purpose);

  // Create short lived JWT for this email
  const nowSec = Math.floor(Date.now() / 1000);
  const payload = {
    sub: email,
    name: record.name,
    iat: nowSec,
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: `${TOKEN_EXPIRES_IN_MINUTES}m` });
  return token;
}
