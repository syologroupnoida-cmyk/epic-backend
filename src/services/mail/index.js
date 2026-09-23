import { sendMail } from './mailer.js';
import { passwordChangedNoticeTemplate } from './templates/passwordChangedNotice.template.js';
import { vendorApprovedNoticeTemplate } from './templates/vendorApprovedNotice.template.js';
import { vendorRejectedNoticeTemplate } from './templates/vendorRejectedNotice.template.js';
import { enqueueOtpEmail } from './otpQueue.js';

export { verifyMailTransport } from './mailer.js';
export { startOtpEmailConsumer, closeOtpEmailQueue } from './otpQueue.js';

export const sendVerificationOtp = async ({ to, firstName, code }) => {
  return enqueueOtpEmail({ type: 'EMAIL_VERIFICATION', to, firstName, code });
};

export const sendPasswordResetOtp = async ({ to, firstName, code }) => {
  return enqueueOtpEmail({ type: 'PASSWORD_RESET', to, firstName, code });
};

export const sendPasswordChangedNotice = async ({ to, firstName, when = new Date() }) => {
  const { subject, html, text } = passwordChangedNoticeTemplate({ firstName, when });
  return sendMail({ to, subject, html, text });
};

export const sendVendorApprovedNotice = async ({ to, firstName, loginUrl }) => {
  const { subject, html, text } = vendorApprovedNoticeTemplate({ firstName, loginUrl });
  return sendMail({ to, subject, html, text });
};

export const sendVendorRejectedNotice = async ({ to, firstName, reason, loginUrl }) => {
  const { subject, html, text } = vendorRejectedNoticeTemplate({ firstName, reason, loginUrl });
  return sendMail({ to, subject, html, text });
};

