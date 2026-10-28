# Lead, Wallet, and Subscription Postman Testing Guide

Import `docs/epic-wedplanner.postman_collection.json` in Postman. The collection already contains all routes in this guide.

## Before testing

Start the API:

```bash
npm run dev
```

Set these collection or environment variables:

| Variable | Value |
| --- | --- |
| `baseUrl` | `http://localhost:4000` |
| `adminAccessToken` | Logged-in ADMIN or SUPER_ADMIN access token |
| `vendorAccessToken` | Logged-in, KYC-approved VENDOR access token |
| `vendorSlug` | Public active vendor profile slug |
| `listingSlug` | Public active service listing slug |
| `venuePropertySlug` | Public active venue-property slug |
| `cityId` | Active city ID |
| `serviceSubcategoryId` | Approved service subcategory ID |
| `basicPlanId` | Active purchasable PAID subscription plan ID |

The vendor used to purchase a shared lead must have approved KYC, an approved capability for `serviceSubcategoryId`, the same primary city as `cityId`, and enough wallet balance.

For local testing set `PAYMENTS_MODE=TEST`. A vendor receives `SIGNUP_WALLET_BONUS` once KYC is approved. You can also use a paid plan with `walletCreditPerBillingCycle` greater than zero.

## Complete testing order

### 1. Vendor subscription and wallet

Folder: **Vendor subscription cards**

1. `Get my effective subscription` — returns active paid plan or the default Free plan.
2. `List available subscription plan cards` — find the paid plan ID and save it as `basicPlanId`.
3. `Test purchase or upgrade subscription` — only in TEST mode; activates the selected plan for 30 days and credits `walletCreditPerBillingCycle`.
4. `Get my wallet balance` — confirms money available to unlock leads.
5. `List my wallet transactions` — confirms immutable `SIGNUP_BONUS`, `SUBSCRIPTION_CREDIT`, and `LEAD_PURCHASE` records.

## 2. Direct lead test

Folder: **Public lead generation**. Choose one:

| Request | Customer starts enquiry from | Created lead |
| --- | --- | --- |
| `Send enquiry to vendor profile` | Vendor profile | Active direct lead for only that vendor |
| `Send enquiry to service listing` | Service listing | Active direct lead for listing owner |
| `Send enquiry to venue property` | Venue property | Active direct lead for property owner |

No customer token is required. The short body has customer name, Indian mobile, optional email, event date, guest count, and message.

Then folder: **Vendor lead inbox**:

1. `List my direct lead previews` stores a lead ID in `leadId`.
2. `Get my direct lead preview by ID` returns masked contact details.
3. In `Purchase and unlock a lead`, replace `{{sharedLeadId}}` with `{{leadId}}` temporarily and send `{}`.
4. The response contains full customer name, phone, email, message, purchase record, and new wallet balance.

Direct lead price is always `directLeadPrice` from the vendor's effective subscription plan.

## 3. Shared Get Quotes lead test

1. In **Public lead generation**, run `Submit Get Quotes requirement`. This makes a `SHARED` lead with `PENDING_REVIEW` status.
2. In **Admin lead management**, run `List leads pending review`; it saves the first ID in `leadId`.
3. Run `Get lead by ID` to review full customer details.
4. Run `Activate shared lead`:

```json
{
  "basePrice": 100,
  "maxBuyerCount": 5
}
```

`basePrice` is charged to every vendor. `maxBuyerCount` is the maximum number of vendors who can unlock it.

5. In **Vendor lead inbox**, run `List matching shared lead previews`. It saves `sharedLeadId`.
6. Run `Purchase and unlock a lead` with `{}`.
7. Check wallet balance and wallet transactions.
8. Run `Get my direct lead preview by ID` using `sharedLeadId`; the same route returns full details after this vendor has purchased the shared lead.

The system checks duplicate purchase, matching approved capability/city, plan monthly purchase limits, wallet funds, and remaining buyer slots. Purchase, wallet debit, and buyer slot reservation run together in one database transaction.

## API purpose reference

### Public lead creation

| Route | Purpose |
| --- | --- |
| `POST /api/v1/marketplace/vendors/:vendorSlug/enquiries` | Direct lead from profile. |
| `POST /api/v1/marketplace/listings/:listingSlug/enquiries` | Direct lead from service listing. |
| `POST /api/v1/marketplace/venue-properties/:venueSlug/enquiries` | Direct lead from venue property. |
| `POST /api/v1/marketplace/leads/get-quotes` | Shared lead for admin review. |

### Admin lead management

| Route | Purpose |
| --- | --- |
| `GET /api/v1/admin/leads` | Lists leads. Filters: `status`, `leadType`, `sourceType`, `targetVendorUserId`, `cityId`, `serviceSubcategoryId`, `page`, `limit`. |
| `GET /api/v1/admin/leads/:leadId` | Full admin-only lead details. |
| `POST /api/v1/admin/leads/:leadId/activate` | Activates a pending shared lead. Body: `basePrice`, `maxBuyerCount`. |
| `POST /api/v1/admin/leads/:leadId/reject` | Rejects pending shared lead. Body: `reason`. |
| `POST /api/v1/admin/leads/:leadId/close` | Stops future purchases. Body: `reason`. |

### Vendor lead and wallet

| Route | Purpose |
| --- | --- |
| `GET /api/v1/vendor/leads` | Active direct-lead previews for that vendor. |
| `GET /api/v1/vendor/leads/shared` | Available shared-lead previews matching vendor city/capability. |
| `GET /api/v1/vendor/leads/:leadId` | Preview; full contact/message only after purchase. |
| `POST /api/v1/vendor/leads/:leadId/purchase` | Empty body `{}`; debits wallet and unlocks lead. |
| `GET /api/v1/vendor/wallet` | Current wallet balance. |
| `GET /api/v1/vendor/wallet/transactions` | Wallet ledger, with `page` and `limit`. |

### Vendor subscription

| Route | Purpose |
| --- | --- |
| `GET /api/v1/vendor/subscription` | Effective paid or Free plan. |
| `GET /api/v1/vendor/subscription-plans` | Active plan cards and frontend button state. |
| `POST /api/v1/vendor/subscriptions/test-purchase` | TEST-only activation. Body: `{ "planId": "..." }`. |

## Common errors

| Error | Meaning |
| --- | --- |
| `400 Validation failed` | Invalid body, ID, pagination, or Indian mobile number. |
| `401` / `403` | Missing/wrong token, KYC not approved, or TEST route attempted in LIVE mode. |
| `409 insufficient wallet balance` | Buy a test subscription with wallet credit or use a lower-priced lead. |
| `409 monthly lead-purchase limit` | Plan limit reached. |
| `409 no remaining buyer slots` | Shared lead sold out. |
| `409 already purchased` | Same vendor cannot purchase same lead twice. |
| `409 does not match approved city and capability` | Vendor does not match shared lead eligibility. |

Real payment checkout, wallet top-up payment, verified webhooks, refund flow, and admin wallet adjustment remain the later payment-gateway phase.
