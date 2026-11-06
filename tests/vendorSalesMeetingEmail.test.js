import test from 'node:test';
import assert from 'node:assert/strict';
import { vendorSalesMeetingNoticeTemplate } from '../src/services/mail/templates/vendorSalesMeetingNotice.template.js';

const meeting = {
  firstName: 'Ravi',
  requestedStartAt: '2027-02-10T04:30:00.000Z',
  requestedEndAt: '2027-02-10T05:00:00.000Z',
  scheduledStartAt: '2027-02-10T08:30:00.000Z',
  scheduledEndAt: '2027-02-10T09:00:00.000Z',
  vendorMessage: 'Your requested slot was unavailable.',
  meetingUrl: 'https://meet.google.com/abc-defg-hij',
};

test('confirmed sales-meeting email includes final time and Google Meet URL', () => {
  const email = vendorSalesMeetingNoticeTemplate({ ...meeting, status: 'CONFIRMED' });
  assert.match(email.subject, /confirmed/i);
  assert.match(email.text, /meet\.google\.com/);
  assert.match(email.html, /Join Google Meet/);
});

test('rejected sales-meeting email does not render an arbitrary HTML message as markup', () => {
  const email = vendorSalesMeetingNoticeTemplate({ ...meeting, status: 'REJECTED', vendorMessage: '<script>alert(1)<\/script>' });
  assert.match(email.html, /&lt;script&gt;/);
  assert.doesNotMatch(email.html, /<script>alert/);
});
