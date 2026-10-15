# Epic Wedplanner API

Express and PostgreSQL backend for Epic Wedplanner. It uses controllers, services, repositories, validators, and a modular Prisma schema. The implemented scope currently includes authentication, role authorization, vendor KYC, the vendor business-profile foundation, approved vendor capabilities, service/venue catalog administration, cities, email, and Cloudinary uploads.

The public marketplace currently exposes paginated, filterable vendor-profile and approved service-listing discovery, plus individual detail endpoints by slug. All return only marketplace-safe data. Venue-property listings, packages, leads, and payments are planned architecture; their APIs are not implemented yet.

## Setup

1. Install Node.js 18.18+, PostgreSQL, and RabbitMQ.
2. Run `npm ci` in this folder.
3. Copy `.env.example` to `.env`. Set a **new, separate** PostgreSQL database URL and real JWT, SMTP, Google, and Cloudinary values. Never reuse the Tripz database or secrets.
4. Run `npm run prisma:deploy` and `npm run prisma:generate`.
5. Set strong `SUPERADMIN_*` values in `.env` and run `npm run prisma:seed` once.
6. Run `npm run dev` (or `npm start`). The API listens on `PORT` (default 4000).

The migrations create users, customer profiles, vendor profiles, KYC submissions and documents, cities, normalized vendor capabilities, service categories and subcategories, refresh tokens, and email OTPs. `prisma:seed` creates the initial super admin. Public registration allows `CLIENT` and `VENDOR` only; the super admin creates admins. All vendors use the single `VENDOR` role. What a vendor offers is represented by approved capabilities and, later, marketplace listings rather than by an account type.

### Applying the marketplace migrations

The checked-in marketplace migrations add cities, vendor capabilities, business-profile fields, and service listing tables. Apply all migrations before calling the new endpoints:

```powershell
npm run prisma:deploy
npm run prisma:generate
```

For a local development database, `npm run prisma:migrate` may be used instead of `prisma:deploy`. Use `prisma:deploy` in deployed environments. The migration backfills public drafts and valid capabilities for vendors that were already approved; it does not modify their KYC snapshots. It creates the city table but does not populate it, so an admin must add active cities before a new vendor can submit KYC.

Verification and password-reset OTP emails use the durable RabbitMQ queue
named epic-wedplanner.otp-emails. The API process also consumes the queue,
retries SMTP failures through its retry queue, and moves exhausted jobs to its
failed queue. Queue name, prefetch, retry delay, and maximum retries can be
configured with the RABBITMQ environment variables in .env.example.

## KYC and business-profile ownership

`VendorKyc` and `VendorProfile` have different responsibilities even when a few approved values initially look the same:

| Model | Responsibility | Who changes it |
| --- | --- | --- |
| `VendorKyc` and `VendorKycDocument` | Private verification submission and review history: company/contact/address details, selected catalog IDs, the selected primary-city ID and readable city-name snapshot, identity/document data, and review metadata | Vendor submission, then admin review |
| `VendorProfile` | Marketplace-facing business identity and publication state: business name, about text, logo, slug, primary city, and `DRAFT`/`ACTIVE` status | Initialized on approval, then edited by the approved vendor |
| `VendorCapability` | Normalized active service subcategories the vendor has selected to advertise | Initialized during admin KYC approval, then directly replaced by the approved vendor |

KYC submission does **not** copy public business fields into `VendorProfile`. It only stores the submitted snapshot and changes `VendorProfile.kycStatus` to `SUBMITTED`. On approval, the backend initializes the draft business profile from the approved snapshot and creates approved capability rows. This keeps private verification data out of public marketplace responses while allowing the vendor to edit public marketing text later without changing the approved KYC record.

## Vendor lifecycle

1. Vendor registration creates a `User` and an empty `VendorProfile` with `kycStatus=PENDING` and `profileStatus=DRAFT`.
2. The vendor frontend loads active cities from `GET /api/v1/cities`, the vendor selects one primary operating city, and the final `POST /api/v1/vendor/kyc` body includes its required `primaryCityId`. The form also captures a separate legal business address with required `city` and `countryCode`; the current India-only API requires and normalizes the country code to `IN`. In one transaction, the backend stores the operating-city ID and readable name, the legal address snapshot, and the document rows in `VendorKyc`; it then changes only the profile's KYC status to `SUBMITTED`, deactivates the user, and revokes refresh tokens while the application is under review.
3. An admin approves the submitted KYC. Approval verifies the documents and that the selected city is still active, assigns the stored `primaryCityId` to the draft `VendorProfile`, reactivates the user, and converts the approved selected subcategories into `VendorCapability` rows. Legacy KYC rows without a city ID may use name-based fallback matching during approval.
4. The approved vendor reviews and edits the draft with `PATCH /api/v1/vendor/profile`. The vendor can view services with `GET /api/v1/vendor/capabilities` and directly replace selected active categories/subcategories with `PUT /api/v1/vendor/capabilities`; this changes only that vendor's selections, never the admin-owned catalog.
5. To publish, the vendor sets `profileStatus` to `ACTIVE`. `businessName`, `about`, a generated slug, and an active `primaryCityId` must be present.
6. Public discovery uses `GET /api/v1/marketplace/vendors`; selecting a vendor uses `GET /api/v1/marketplace/vendors/:slug`. A vendor appears only while its user account and primary city are active, KYC is approved, and the profile is `ACTIVE`. Only approved capabilities whose category and subcategory are active are returned.

A rejected application changes KYC to `REJECTED`, suspends the profile, deactivates existing capabilities, reactivates the user, and allows a corrected KYC resubmission.

`VendorProfile.primaryCityId` represents one main business/base city; it is not the vendor's complete coverage area. When service listings are implemented, each listing can serve multiple active cities through `ListingServiceArea`. A venue-property listing instead has one physical city. This lets the same vendor offer different services in different cities without storing an array of cities on KYC or the profile.

## Routes

All routes use `/api/v1`:

| Route | Purpose |
| --- | --- |
| `POST /auth/register` | Client or vendor registration; sends verification OTP |
| `POST /auth/verify-email`, `/auth/resend-otp` | Email verification |
| `POST /auth/login`, `/auth/google/login` | Password or Google login |
| `POST /auth/refresh`, `/auth/logout` | Rotate or revoke refresh token |
| `POST /auth/password/forgot`, `/auth/password/verify-otp`, `/auth/password/reset` | Password recovery |
| `GET/PATCH /auth/me`, `POST /auth/change-password` | Profile and password |
| `POST /uploads/image` | Authenticated multipart upload (`file`, `purpose`, optional `name`) to Cloudinary |
| `GET /service-categories` | Active public categories and active subcategories; supports `offeringKind=SERVICE` or `VENUE_PROPERTY` |
| `GET /service-categories/:id` | Active public category details with active subcategories |
| `GET /service-subcategories?serviceCategoryId=:id` | Active public subcategories filtered by category |
| `GET /cities`, `GET /cities/:id` | Public active-city discovery |
| `GET/POST /vendor/kyc` | Vendor KYC status and final company form submission |
| `GET /vendor/profile` | Vendor's own draft or active business profile; available at every KYC stage |
| `PATCH /vendor/profile` | Approved vendor updates or publishes the business profile |
| `GET /vendor/capabilities` | Approved vendor's normalized capabilities |
| `PUT /vendor/capabilities` | Approved vendor directly replaces selected active category/subcategory capabilities |
| `GET/POST /vendor/listings` | Vendor lists own service listings or creates a service-listing draft |
| `GET/PATCH /vendor/listings/:listingId` | Vendor retrieves or edits one draft/rejected service listing |
| `POST /vendor/listings/:listingId/submit` | Vendor submits a complete service listing for admin review |
| `GET /marketplace/vendors` | Paginated public vendor discovery; supports `page`, `limit`, `search`, `cityId`, `serviceCategoryId`, `serviceSubcategoryId`, and `offeringKind` filters |
| `GET /marketplace/vendors/:slug` | Public active vendor profile with approved capabilities |
| `GET /marketplace/listings`, `GET /marketplace/listings/:slug` | Public active service-listing discovery and detail |
| `GET /admin/vendor-kyc`, `POST /admin/vendor-kyc/:userId/approve` or `/reject` | Admin review |
| `GET /admin/listings`, `POST /admin/listings/:listingId/approve` or `/reject` | Admin service-listing review |
| `GET/POST /admin/cities`, `GET/PATCH/PUT /admin/cities/:id` | Admin city management |
| `POST /super-admin/admins` | Create admin |

Send access tokens as `Authorization: Bearer <token>`. Web refresh tokens also use an HTTP-only cookie; API clients can send the refresh token in JSON.

The marketplace vendor-list endpoint is unauthenticated. Its response uses `data.vendors` for public vendor cards and `data.pagination` for page metadata. Each card is built with the same allowlisted public fields used by the slug-detail endpoint: `vendorId`, business name, slug, about text, logo URL, active primary city, and active approved services/categories. `search` matches public vendor text, while the service filters match active approved capabilities. Private legal addresses, contact details, PAN/Aadhaar/GST/CIN data and files, KYC submissions, and internal review fields are never returned. The usual client flow is list vendors, open a card by its `slug`, and request the detail endpoint.

Admins can create one or multiple service categories through `POST /api/v1/admin/service-categories`. Send one category object for a single result, or an array of category objects for transactional bulk creation. Set `offeringKind` to `SERVICE` for ordinary services or `VENUE_PROPERTY` for venue inventory; it defaults to `SERVICE`. Categories and subcategories are created separately; use `POST /api/v1/admin/service-subcategories` to create each subcategory under an existing category.
To add multiple subcategories to one category in a single transaction, send `serviceCategoryId` with a `subcategories` array to `POST /api/v1/admin/service-subcategories`. The original single-subcategory body remains supported.
Both public and admin category GET responses include the complete `subcategories` array and `_count.subcategories`.
Category and subcategory list endpoints support `search`, exact `id`, exact `slug`, `page`, and `limit` query parameters. Subcategory lists additionally support `serviceCategoryId`; category search also checks nested subcategory names and descriptions.
A category cannot be deleted while it contains subcategories. Delete the subcategories or move them to another category first; the category delete endpoint returns `409 Conflict` otherwise.
Admins update one category at a time through `PATCH /api/v1/admin/service-categories/:id`; the category ID is supplied in the URL. Category and subcategory updates remain separate; use `PATCH /api/v1/admin/service-subcategories/:id` for a subcategory.

## Manual KYC review

Upload PAN, Aadhaar, GSTIN, and CIN files with the matching `kyc-pan`, `kyc-aadhaar`, `kyc-gst`, and `kyc-cin` purposes. Uploading returns `url` and `publicId` without writing a KYC document row. Before rendering the KYC form, load `GET /api/v1/cities` and present the returned active cities as a dropdown. The final `POST /api/v1/vendor/kyc` body must send the selected city's ID as `primaryCityId` together with each document's number, URL, and public ID; the backend validates and saves the form and document rows in one transaction. PAN and Aadhaar are required, while GSTIN and CIN are optional.

The operating city and legal business-address city are separate fields:

```json
{
  "primaryCityId": "{{cityId}}",
  "businessAddress": {
    "street": "123 Main Street",
    "locality": "Andheri West",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400053",
    "countryCode": "IN"
  }
}
```

The backend verifies that `primaryCityId` belongs to an active catalogue `City`. `VendorKyc.primaryCityId` preserves the selected relation, while `VendorKyc.primaryOperatingCity` stores the selected city's name as a readable submission snapshot. The client must not send `primaryOperatingCity` for a new KYC submission. `businessAddress.city` is the submitted legal/office-address city and does not need to match the selected operating city. `businessAddress.countryCode` is required; this India-only version accepts `IN` case-insensitively and stores the normalized value `IN`.

On a corrected resubmission, that final request replaces the managed PAN/Aadhaar/GSTIN/CIN document set; omitted optional GSTIN/CIN rows are removed so an admin never reviews stale documents from the previous submission.
Document numbers can be checked before submission through `POST /api/v1/vendor/kyc/validate/pan`, `/aadhaar`, `/gstin`, or `/cin`. These endpoints validate and normalize only; they never write to the database. Final KYC submission revalidates the numbers and remains the only document persistence operation.

Registration captures the account holder's name, mobile number, email address, and password. The final `POST /api/v1/vendor/kyc` form separately captures the company and KYC contact details. The document routes are unchanged.
The current public form accepts `servicecategoriesIds` and `servicesSubCategoryIds` arrays (the canonical `serviceCategoryIds` and `serviceSubcategoryIds` names remain supported). It also captures the required `primaryCityId`, company/contact details, legal business address (including required `city` and India-only `countryCode`), description, social links, referral sources, source notes, and the vendor's document checklist. Every submitted catalog ID must exist, every selected subcategory must belong to one of the selected categories, and `primaryCityId` must identify an active city. Document checklist values are declarations only; only an admin can set the actual document verification status. Public logos are uploaded after approval and saved on `VendorProfile`.

An admin lists submissions with `GET /api/v1/admin/vendor-kyc`, reviews the documents, and calls `POST /api/v1/admin/vendor-kyc/:userId/approve` or `/reject`. Approval activates the vendor account, creates the approved capability projection, and initializes a draft public business profile. It does not publish the profile automatically. Rejection records a reason and lets the vendor resubmit.

## Vendor classification

The API and Prisma client use one `VENDOR` role and no vendor-type choice. The checked-in `20260922010000_remove_vendor_type` migration removes the old `vendorType` column. Service versus venue capability is now modeled through `ServiceCategory.offeringKind`, while the approved subcategories for each vendor are stored in `VendorCapability`.

## Postman

Import `docs/epic-wedplanner.postman_collection.json` and `docs/epic-wedplanner.postman_environment.json`, then select **Epic Wedplanner Local**. Set the account passwords, OTPs, and Google ID token as needed. Login, refresh, upload, and reset responses save their returned values to the selected environment. The environment export contains no real credentials.
