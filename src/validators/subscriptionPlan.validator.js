import { z } from 'zod';

const id = (field) => z.string({ required_error: `${field} is required` }).trim()
  .min(1, `${field} is required`).max(100, `${field} is invalid`);

const nonNegativeInt = (field, max = 100000000) => z.coerce.number().int()
  .min(0, `${field} must be zero or greater`).max(max, `${field} is too large`);

const planCode = z.string({ required_error: 'code is required' }).trim().toUpperCase()
  .regex(/^[A-Z][A-Z0-9_]{1,39}$/, 'code must use 2-40 uppercase letters, numbers, or underscores');

const benefits = z.array(z.string().trim().min(2).max(180)).max(30, 'You can add at most 30 benefits')
  .refine((items) => new Set(items.map((item) => item.toLowerCase())).size === items.length, 'Benefits must be unique');

const queryBoolean = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());

const planFields = {
  code: planCode,
  kind: z.enum(['FREE', 'PAID']),
  displayName: z.string().trim().min(2).max(80),
  shortDescription: z.string().trim().min(10).max(300),
  monthlyPrice: nonNegativeInt('monthlyPrice'),
  directLeadPrice: nonNegativeInt('directLeadPrice'),
  walletCreditPerBillingCycle: nonNegativeInt('walletCreditPerBillingCycle').default(0),
  maxActiveServiceListings: nonNegativeInt('maxActiveServiceListings', 10000),
  maxActiveVenueProperties: nonNegativeInt('maxActiveVenueProperties', 10000),
  maxDirectLeadPurchasesPerMonth: nonNegativeInt('maxDirectLeadPurchasesPerMonth', 100000),
  maxSharedLeadPurchasesPerMonth: nonNegativeInt('maxSharedLeadPurchasesPerMonth', 100000),
  maxMediaPerListing: nonNegativeInt('maxMediaPerListing', 1000),
  featuredListingSlots: nonNegativeInt('featuredListingSlots', 10000),
  benefits,
  badgeText: z.string().trim().min(2).max(60).nullable().optional(),
  theme: z.enum(['BLUE', 'PURPLE', 'GOLD', 'DARK']).default('BLUE'),
  ctaText: z.string().trim().min(2).max(60),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(false),
  isDefault: z.boolean().default(false),
  isPurchasable: z.boolean().default(true),
};

export const createSubscriptionPlanSchema = z.object(planFields).strict();

export const updateSubscriptionPlanSchema = z.object(Object.fromEntries(
  Object.entries(planFields).map(([key, schema]) => [key, schema.optional()]),
)).strict().superRefine((payload, ctx) => {
  if (Object.keys(payload).length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'At least one subscription plan field is required' });
  }
});

export const subscriptionPlanIdParamsSchema = z.object({
  planId: id('planId'),
}).strict();

export const testPurchaseSubscriptionSchema = z.object({
  planId: id('planId'),
}).strict();

export const adminSubscriptionPlanListQuerySchema = z.object({
  isActive: queryBoolean.optional(),
  kind: z.enum(['FREE', 'PAID']).optional(),
}).strict();
