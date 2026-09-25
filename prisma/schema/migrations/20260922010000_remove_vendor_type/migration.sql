-- Vendor type is no longer part of the wedding vendor model.
-- Existing values are obsolete; all vendors use the VENDOR account role.
DROP INDEX IF EXISTS "vendor_profiles_vendorType_idx";
ALTER TABLE "vendor_profiles" DROP COLUMN IF EXISTS "vendorType";
DROP TYPE IF EXISTS "VendorType";
