import { OAuth2Client } from 'google-auth-library';
import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

const requiredCalendarConfig = [
  'GOOGLE_CALENDAR_CLIENT_ID',
  'GOOGLE_CALENDAR_CLIENT_SECRET',
  'GOOGLE_CALENDAR_REDIRECT_URI',
  'GOOGLE_CALENDAR_REFRESH_TOKEN',
  'GOOGLE_CALENDAR_ID',
];

const getCalendarClient = () => {
  const missing = requiredCalendarConfig.filter((key) => !env[key]);
  if (missing.length) {
    throw ApiError.internal(`Google Calendar is not configured. Missing: ${missing.join(', ')}.`);
  }

  const client = new OAuth2Client(
    env.GOOGLE_CALENDAR_CLIENT_ID,
    env.GOOGLE_CALENDAR_CLIENT_SECRET,
    env.GOOGLE_CALENDAR_REDIRECT_URI,
  );
  client.setCredentials({ refresh_token: env.GOOGLE_CALENDAR_REFRESH_TOKEN });
  return client;
};

const getMeetUrl = (event) => event.hangoutLink
  || event.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === 'video')?.uri
  || null;

/**
 * Creates an event in the dedicated company Calendar and asks Google to
 * generate its Meet conference. Vendor identity, contact details, and notes
 * stay in Epic Wedplanner's database and are never sent to Google.
 */
export const createVendorSalesMeetingEvent = async ({ meetingId, scheduledStartAt, scheduledEndAt }) => {
  const client = getCalendarClient();
  let accessToken;

  try {
    ({ token: accessToken } = await client.getAccessToken());
  } catch (error) {
    console.error('[google-calendar] Could not obtain Calendar access token:', error?.message);
    throw ApiError.internal('Google Calendar connection failed. Ask an administrator to reconnect the company calendar.');
  }

  if (!accessToken) throw ApiError.internal('Google Calendar connection did not return an access token.');

  const event = {
    summary: 'Epic Wedplanner sales meeting',
    description: `Epic Wedplanner meeting reference: ${meetingId}`,
    start: { dateTime: scheduledStartAt.toISOString(), timeZone: 'Asia/Kolkata' },
    end: { dateTime: scheduledEndAt.toISOString(), timeZone: 'Asia/Kolkata' },
    conferenceData: {
      createRequest: {
        requestId: `epic-sales-${meetingId}-${randomUUID()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  let response;
  try {
    response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(env.GOOGLE_CALENDAR_ID)}/events?conferenceDataVersion=1&sendUpdates=none`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      },
    );
  } catch (error) {
    console.error('[google-calendar] Calendar request failed:', error?.message);
    throw ApiError.internal('Could not create the Google Calendar event. Please try confirming the meeting again.');
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('[google-calendar] Calendar event creation failed:', response.status, result?.error?.message);
    throw ApiError.internal('Could not create the Google Meet link. The meeting was not confirmed.');
  }

  const meetingUrl = getMeetUrl(result);
  if (!meetingUrl) {
    console.error('[google-calendar] Calendar event did not include a Google Meet link:', result?.id);
    throw ApiError.internal('Google Calendar created the event without a Google Meet link. The meeting was not confirmed.');
  }

  return { meetingUrl, calendarEventId: result.id };
};
