import { z } from 'zod';

export const USER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'VENDOR', 'CLIENT'];

// Self-signup is only allowed for CLIENT or VENDOR — ADMIN/SUPER_ADMIN are
// created via the SuperAdmin endpoint, never via the public auth API.
export const SELF_SIGNUP_ROLES = ['CLIENT', 'VENDOR'];

const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters long')
  .max(72, 'Password must not exceed 72 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const nameField = z
  .string({ required_error: 'Required' })
  .trim()
  .min(2, 'Must be at least 2 characters long')
  .max(40, 'Must not exceed 40 characters');

const emailField = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .email('Invalid email address');

const phoneField = z
  .string({ required_error: 'Phone is required' })
  .trim()
  .regex(/^\d{10,15}$/, 'Phone must be 10 to 15 digits');

export const registerSchema = z
  .object({
    firstName: nameField,
    lastName: nameField,
    email: emailField,
    phone: phoneField,
    password: passwordSchema,
    role: z.enum(['CLIENT', 'VENDOR'], {
      errorMap: () => ({ message: 'Role must be either "CLIENT" or "VENDOR"' }),
    }),
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailField,
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password is required'),
  })
  .strict();

// refreshToken is optional in the body — web clients send it via httpOnly cookie,
// mobile/API clients send it in the JSON body. Controller enforces "one or the other".
export const refreshTokenSchema = z
  .object({
    refreshToken: z.string().min(20, 'Refresh token is invalid').optional(),
  })
  .strict();

export const logoutSchema = refreshTokenSchema;

export const verifyEmailSchema = z
  .object({
    email: emailField,
    otp: z
      .string({ required_error: 'OTP is required' })
      .trim()
      .regex(/^\d+$/, 'OTP must contain only digits')
      .min(4, 'OTP is too short')
      .max(10, 'OTP is too long'),
  })
  .strict();

export const resendOtpSchema = z
  .object({
    email: emailField,
  })
  .strict();

// ---- Password reset (OTP-based, mirrors verification flow) ----
export const forgotPasswordSchema = z
  .object({
    email: emailField,
  })
  .strict();

// Step 2 of password reset — verify OTP only (no new password yet).
export const verifyResetOtpSchema = z
  .object({
    email: emailField,
    otp: z
      .string({ required_error: 'OTP is required' })
      .trim()
      .regex(/^\d+$/, 'OTP must contain only digits')
      .min(4, 'OTP is too short')
      .max(10, 'OTP is too long'),
  })
  .strict();

// Step 3 of password reset — exchange the reset token (from step 2) for a
// new password. The token carries the user identity, so we no longer need
// `email` or `otp` in this request.
export const resetPasswordSchema = z
  .object({
    resetToken: z
      .string({ required_error: 'resetToken is required' })
      .min(20, 'resetToken is invalid'),
    newPassword: passwordSchema,
  })
  .strict();

// ---- Google OAuth login ----
// `role` is only used when creating a brand-new account. Existing users
// just send the Google token.
export const googleLoginSchema = z
  .object({
    token: z
      .string({ required_error: 'Google ID token is required' })
      .min(20, 'Google token is invalid'),
    role: z.enum(['CLIENT', 'VENDOR']).optional(),
  })
  // .strict() rejects extra fields — we tolerate extras because frontend may
  // ship email/picture/etc for debugging. We always ignore them server-side.
  .passthrough();

// ---- Profile update (self, any authenticated role) ----
// Updateable User fields only. Email, password, and role are not changed.
// Empty string for avatarUrl is coerced to null (frontend "remove avatar" flow).
export const updateProfileSchema = z
  .object({
    firstName: nameField.optional(),
    lastName:  nameField.optional(),
    phone:     phoneField.optional(),
    avatarUrl: z
      .string()
      .trim()
      .max(1000, 'avatarUrl too long')
      .optional()
      .or(z.literal('').transform(() => null)),
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, {
    message: 'At least one field must be provided',
  });

// ---- Change password (authenticated user knows their current password) ----
// Distinct from /password/reset (OTP-based, for forgotten passwords). This
// requires the current password as a security safeguard — protects against
// someone using a stolen session token to lock out the owner.
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: 'currentPassword is required' })
      .min(1, 'currentPassword is required'),
    newPassword: passwordSchema,
  })
  .strict()
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

// ---- Admin creation (SuperAdmin only) ----
export const createAdminSchema = z
  .object({
    firstName: nameField,
    lastName: nameField,
    email: emailField,
    phone: phoneField,
    password: passwordSchema,
  })
  .strict();
