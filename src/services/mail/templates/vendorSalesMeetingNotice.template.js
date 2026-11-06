const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const formatDateTime = (value) => new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
}).format(new Date(value));

const statusContent = ({ status, scheduledStartAt, scheduledEndAt }) => {
  if (status === 'CONFIRMED') {
    return {
      subject: 'Your Epic Wedplanner sales meeting is confirmed',
      heading: 'Your meeting is confirmed',
      intro: `Your meeting is scheduled for ${formatDateTime(scheduledStartAt)} to ${formatDateTime(scheduledEndAt)}.`,
    };
  }
  if (status === 'REJECTED') {
    return {
      subject: 'Update on your Epic Wedplanner sales meeting request',
      heading: 'Meeting request update',
      intro: 'Your requested meeting time could not be approved. You can submit another preferred time from your vendor dashboard.',
    };
  }
  if (status === 'CANCELLED') {
    return {
      subject: 'Your Epic Wedplanner sales meeting was cancelled',
      heading: 'Meeting cancelled',
      intro: 'Your sales meeting was cancelled. Please submit a new meeting request if you still need assistance.',
    };
  }
  if (status === 'NO_SHOW') {
    return {
      subject: 'You missed your Epic Wedplanner sales meeting',
      heading: 'Meeting marked as missed',
      intro: 'You did not join the scheduled sales meeting. Please submit a new meeting request when you are available.',
    };
  }
  throw new Error(`Unsupported vendor sales meeting notification status: ${status}`);
};

export const vendorSalesMeetingNoticeTemplate = ({
  firstName,
  status,
  requestedStartAt,
  requestedEndAt,
  scheduledStartAt,
  scheduledEndAt,
  vendorMessage,
  meetingUrl,
}) => {
  const content = statusContent({ status, scheduledStartAt, scheduledEndAt });
  const safeName = escapeHtml(firstName || 'there');
  const requestedTime = requestedStartAt && requestedEndAt
    ? `${formatDateTime(requestedStartAt)} to ${formatDateTime(requestedEndAt)}`
    : null;
  const finalTime = scheduledStartAt && scheduledEndAt
    ? `${formatDateTime(scheduledStartAt)} to ${formatDateTime(scheduledEndAt)}`
    : null;
  const safeMessage = vendorMessage ? escapeHtml(vendorMessage) : null;
  const safeMeetingUrl = meetingUrl ? escapeHtml(meetingUrl) : null;

  const text = [
    `Hi ${firstName || 'there'},`,
    '',
    content.intro,
    requestedTime && `Your requested time: ${requestedTime}`,
    finalTime && `Confirmed time: ${finalTime}`,
    safeMessage && `Message from Epic Wedplanner: ${vendorMessage}`,
    safeMeetingUrl && `Join Google Meet: ${meetingUrl}`,
    '',
    '— Epic Wedplanner Team',
  ].filter(Boolean).join('\n');

  const html = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a;">
    <h2 style="margin:0 0 16px;font-size:20px;color:#0f172a;">${content.heading}</h2>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.5;">Hi ${safeName},</p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.5;">${escapeHtml(content.intro)}</p>
    ${requestedTime ? `<p style="margin:0 0 8px;font-size:14px;"><strong>Your requested time:</strong> ${escapeHtml(requestedTime)}</p>` : ''}
    ${finalTime ? `<p style="margin:0 0 16px;font-size:14px;"><strong>Confirmed time:</strong> ${escapeHtml(finalTime)}</p>` : ''}
    ${safeMessage ? `<p style="margin:0 0 20px;padding:12px;background:#f8fafc;border-radius:6px;font-size:14px;line-height:1.5;"><strong>Message from Epic Wedplanner:</strong><br>${safeMessage}</p>` : ''}
    ${safeMeetingUrl ? `<p style="margin:0 0 24px;"><a href="${safeMeetingUrl}" style="background:#0f172a;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">Join Google Meet</a></p>` : ''}
    <p style="margin:0;font-size:13px;color:#475569;">If you have any questions, reply to this email.</p>
  </div>`;

  return { subject: content.subject, html, text };
};
