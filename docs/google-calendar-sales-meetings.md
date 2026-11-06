# Google Calendar and Meet setup for sales meetings

This integration uses one dedicated Epic Wedplanner Google account, for example
`sales@yourdomain.com`. That account owns every Calendar event and every Google
Meet link. Do not use a developer's or an individual admin's personal Google
account.

## What the API does

When an admin confirms a pending meeting using `PATCH /api/v1/admin/sales-meetings/:meetingId`, the API:

1. creates a generic event in the company Google Calendar for the chosen time;
2. asks Google Calendar to create a Google Meet conference;
3. saves the returned Meet URL on the meeting; and
4. changes the meeting to `CONFIRMED` only after those steps succeed.

Vendor name, email, phone number, and notes remain in the Epic Wedplanner
database. They are not sent to Google Calendar. Google receives only the time,
the generic event name, and the internal meeting reference.

## Google Cloud configuration

1. Create or select the Epic Wedplanner project in Google Cloud Console.
2. Enable **Google Calendar API** for that project.
3. Configure the OAuth consent screen. Add the company calendar account as a
   test user while the app is in Testing mode.
4. Create an **OAuth client ID** of type **Web application**.
5. Add the redirect URI used when you obtain the refresh token. If using Google
   OAuth Playground, add `https://developers.google.com/oauthplayground`.
6. Authorize using the dedicated company Google account with this scope:

   `https://www.googleapis.com/auth/calendar.events`

7. Obtain a refresh token with offline access. Store it only on the server;
   never place it in Postman, frontend code, Git, or a browser.

## Server environment

Set these values in the server `.env` (and VPS environment). `primary` means
the primary calendar of the connected company Google account. A specific
calendar ID can be used instead.

```env
GOOGLE_CALENDAR_CLIENT_ID="...apps.googleusercontent.com"
GOOGLE_CALENDAR_CLIENT_SECRET="..."
GOOGLE_CALENDAR_REDIRECT_URI="https://developers.google.com/oauthplayground"
GOOGLE_CALENDAR_REFRESH_TOKEN="..."
GOOGLE_CALENDAR_ID="primary"
```

Restart the API after changing environment variables. If any value is missing,
the admin confirmation endpoint returns an error and leaves the meeting as
`PENDING`; it never marks a meeting confirmed without a join link.

## Confirm request

The admin does not send a `meetingUrl`.

```json
{
  "status": "CONFIRMED",
  "scheduledStartAt": "2027-02-10T10:00:00+05:30",
  "scheduledEndAt": "2027-02-10T10:30:00+05:30",
  "vendorMessage": "Our sales specialist will explain plans and lead pricing.",
  "adminNote": "Internal assignment: sales team A."
}
```

The API response contains `meetingUrl`. The vendor's `GET /api/v1/vendor/sales-meetings/:meetingId` response shows that URL only when the status is `CONFIRMED`.
