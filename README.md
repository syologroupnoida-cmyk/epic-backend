# Epic Wedplanner authentication API

Standalone Express and PostgreSQL backend extracted from Tripz. It keeps the same `src/controllers`, `services`, `repositories`, `routes`, `validators`, and modular Prisma schema layout. Only account, role authorization, vendor KYC, email, and upload features are mounted.

## Setup

1. Install Node.js 18.18+, PostgreSQL, and RabbitMQ.
2. Run `npm ci` in this folder.
3. Copy `.env.example` to `.env`. Set a **new, separate** PostgreSQL database URL and real JWT, SMTP, Google, and Cloudinary values. Never reuse the Tripz database or secrets.
4. Run `npm run prisma:deploy` and `npm run prisma:generate`.
5. Set strong `SUPERADMIN_*` values in `.env` and run `npm run prisma:seed` once.
6. Run `npm run dev` (or `npm start`). The API listens on `PORT` (default 4000).

The migration creates only users, customer profiles, vendor profiles, KYC submissions and documents, refresh tokens, and email OTPs. `prisma:seed` creates the initial super admin. Public registration allows `CLIENT` and `VENDOR` only; the super admin creates admins. All vendors use the single `VENDOR` role. They may offer individual services, wedding packages, or both; this is not an account type.

Verification and password-reset OTP emails use the durable RabbitMQ queue
named epic-wedplanner.otp-emails. The API process also consumes the queue,
retries SMTP failures through its retry queue, and moves exhausted jobs to its
failed queue. Queue name, prefetch, retry delay, and maximum retries can be
configured with the RABBITMQ environment variables in .env.example.

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
| `GET /service-categories` | Public categories, each with all of its subcategories |
| `GET /service-categories/:id` | Public category details with all of its subcategories |
| `GET /service-subcategories?serviceCategoryId=:id` | Public subcategories filtered by category |
| `GET/POST /vendor/kyc` | Vendor KYC status and final company form submission |
| `GET /admin/vendor-kyc`, `POST /admin/vendor-kyc/:userId/approve` or `/reject` | Admin review |
| `POST /super-admin/admins` | Create admin |

Send access tokens as `Authorization: Bearer <token>`. Web refresh tokens also use an HTTP-only cookie; API clients can send the refresh token in JSON.

Admins can create one or multiple service categories through `POST /api/v1/admin/service-categories`. Send one category object for a single result, or an array of category objects for transactional bulk creation. Categories and subcategories are created separately; use `POST /api/v1/admin/service-subcategories` to create each subcategory under an existing category.
Admins can transactionally update one or multiple categories through `PATCH /api/v1/admin/service-categories` using an array. Category and subcategory updates remain separate; use `PATCH /api/v1/admin/service-subcategories/:id` for a subcategory.

## Manual KYC review

PAN, Aadhaar, GSTIN, and CIN continue to use their existing document-number routes and matching `kyc-pan`, `kyc-aadhaar`, `kyc-gst`, and `kyc-cin` upload purposes. PAN and Aadhaar are required; GSTIN and CIN remain optional, but an optional document must include both its number and image.

Registration captures the account holder's name, mobile number, email address, and password. The final `POST /api/v1/vendor/kyc` form separately captures the company and KYC contact details. The document routes are unchanged.
The current public form accepts `servicecategoriesIds` and `servicesSubCategoryIds` arrays (the canonical `serviceCategoryIds` and `serviceSubcategoryIds` names remain supported). It also captures company/contact details, address, logo filename, description, social links, referral sources, source notes, and the vendor's document checklist. Every submitted catalog ID must exist, and every selected subcategory must belong to one of the selected categories. Document checklist values are declarations only; only an admin can set the actual document verification status.

An admin lists submissions with `GET /api/v1/admin/vendor-kyc`, reviews the documents, and calls `POST /api/v1/admin/vendor-kyc/:userId/approve` or `/reject`. Approval activates the vendor account. Rejection records a reason and lets the vendor resubmit.

## Legacy database column

The API and Prisma client use one VENDOR role and no vendor type choice. The existing local database still contains its old endorType column so the existing account data is preserved. The optional cleanup SQL is in docs/optional-vendor-type-cleanup.sql; it has not been applied because it deletes that legacy column.

## Postman

Import `docs/epic-wedplanner.postman_collection.json` and `docs/epic-wedplanner.postman_environment.json`, then select **Epic Wedplanner Local**. Set the account passwords, OTPs, and Google ID token as needed. Login, refresh, upload, and reset responses save their returned values to the selected environment. The environment export contains no real credentials.
