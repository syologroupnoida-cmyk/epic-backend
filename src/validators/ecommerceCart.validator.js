import { z } from 'zod';
const id=z.string().trim().min(1).max(100); const text=(max=200)=>z.string().trim().min(1).max(max);
export const addressIdParams=z.object({addressId:id}).strict(); export const cartItemIdParams=z.object({cartItemId:id}).strict();
export const wishlistProductParams=z.object({productId:id}).strict();
export const addressSchema=z.object({fullName:text(150),phone:z.string().trim().regex(/^\d{10}$/),line1:text(250),line2:z.string().trim().max(250).optional().nullable(),locality:z.string().trim().max(150).optional().nullable(),city:text(100),state:text(100),pincode:z.string().trim().regex(/^\d{6}$/),countryCode:z.literal('IN').default('IN'),isDefault:z.boolean().default(false)}).strict();
export const addressPatch=addressSchema.partial().strict().refine(v=>Object.keys(v).length,'At least one field is required.');
export const addCartItem=z.object({variantId:id,quantity:z.coerce.number().int().min(1).max(20).default(1)}).strict();
export const updateCartItem=z.object({quantity:z.coerce.number().int().min(1).max(20)}).strict();
