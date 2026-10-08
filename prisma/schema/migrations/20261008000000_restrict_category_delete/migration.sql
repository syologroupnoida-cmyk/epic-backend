ALTER TABLE "service_subcategories"
DROP CONSTRAINT "service_subcategories_serviceCategoryId_fkey";

ALTER TABLE "service_subcategories"
ADD CONSTRAINT "service_subcategories_serviceCategoryId_fkey"
FOREIGN KEY ("serviceCategoryId") REFERENCES "service_categories"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
