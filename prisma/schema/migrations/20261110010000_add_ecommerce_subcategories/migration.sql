CREATE TABLE "ecommerce_subcategories" (
  "id" TEXT NOT NULL, "categoryId" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL,
  "description" TEXT, "specificationTemplate" JSONB, "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "ecommerce_subcategories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ecommerce_subcategories_slug_key" ON "ecommerce_subcategories"("slug");
CREATE UNIQUE INDEX "ecommerce_subcategories_categoryId_name_key" ON "ecommerce_subcategories"("categoryId", "name");
CREATE INDEX "ecommerce_subcategories_categoryId_isActive_sortOrder_idx" ON "ecommerce_subcategories"("categoryId", "isActive", "sortOrder");
ALTER TABLE "ecommerce_products" ADD COLUMN "subcategoryId" TEXT;
CREATE INDEX "ecommerce_products_subcategoryId_status_idx" ON "ecommerce_products"("subcategoryId", "status");
ALTER TABLE "ecommerce_subcategories" ADD CONSTRAINT "ecommerce_subcategories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ecommerce_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ecommerce_products" ADD CONSTRAINT "ecommerce_products_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "ecommerce_subcategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
