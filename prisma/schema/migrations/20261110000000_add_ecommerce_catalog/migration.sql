CREATE TYPE "EcommerceProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "EcommerceInventoryMovementType" AS ENUM ('INITIAL_STOCK', 'STOCK_RECEIVED', 'MANUAL_ADJUSTMENT', 'ORDER_RESERVED', 'ORDER_RELEASED', 'ORDER_SOLD', 'RETURN_RECEIVED', 'DAMAGED');

CREATE TABLE "ecommerce_categories" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL, "description" TEXT,
  "imageUrl" TEXT, "imagePublicId" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ecommerce_categories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ecommerce_categories_slug_key" ON "ecommerce_categories"("slug");
CREATE INDEX "ecommerce_categories_isActive_sortOrder_idx" ON "ecommerce_categories"("isActive", "sortOrder");

CREATE TABLE "ecommerce_products" (
  "id" TEXT NOT NULL, "categoryId" TEXT NOT NULL, "title" TEXT NOT NULL, "slug" TEXT NOT NULL,
  "shortDescription" TEXT, "description" TEXT NOT NULL, "brandName" TEXT, "specifications" JSONB,
  "optionDefinitions" JSONB, "status" "EcommerceProductStatus" NOT NULL DEFAULT 'DRAFT',
  "isFeatured" BOOLEAN NOT NULL DEFAULT false, "gstPercentage" INTEGER NOT NULL DEFAULT 0,
  "createdByAdminId" TEXT NOT NULL, "publishedAt" TIMESTAMP(3), "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ecommerce_products_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ecommerce_products_slug_key" ON "ecommerce_products"("slug");
CREATE INDEX "ecommerce_products_categoryId_status_idx" ON "ecommerce_products"("categoryId", "status");
CREATE INDEX "ecommerce_products_status_isFeatured_publishedAt_idx" ON "ecommerce_products"("status", "isFeatured", "publishedAt");

CREATE TABLE "ecommerce_product_images" (
  "id" TEXT NOT NULL, "productId" TEXT NOT NULL, "url" TEXT NOT NULL, "publicId" TEXT, "altText" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ecommerce_product_images_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ecommerce_product_images_productId_url_key" ON "ecommerce_product_images"("productId", "url");
CREATE INDEX "ecommerce_product_images_productId_sortOrder_idx" ON "ecommerce_product_images"("productId", "sortOrder");

CREATE TABLE "ecommerce_product_variants" (
  "id" TEXT NOT NULL, "productId" TEXT NOT NULL, "sku" TEXT NOT NULL, "barcode" TEXT, "optionValues" JSONB,
  "mrpAmountPaise" INTEGER NOT NULL, "saleAmountPaise" INTEGER NOT NULL, "costAmountPaise" INTEGER,
  "weightGrams" INTEGER, "imageUrl" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true, "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "onHandQuantity" INTEGER NOT NULL DEFAULT 0, "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ecommerce_product_variants_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ecommerce_product_variants_sku_key" ON "ecommerce_product_variants"("sku");
CREATE UNIQUE INDEX "ecommerce_product_variants_barcode_key" ON "ecommerce_product_variants"("barcode");
CREATE INDEX "ecommerce_product_variants_productId_isActive_idx" ON "ecommerce_product_variants"("productId", "isActive");

CREATE TABLE "ecommerce_inventory_movements" (
  "id" TEXT NOT NULL, "variantId" TEXT NOT NULL, "type" "EcommerceInventoryMovementType" NOT NULL,
  "quantity" INTEGER NOT NULL, "note" TEXT, "adminId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ecommerce_inventory_movements_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ecommerce_inventory_movements_variantId_createdAt_idx" ON "ecommerce_inventory_movements"("variantId", "createdAt");
ALTER TABLE "ecommerce_products" ADD CONSTRAINT "ecommerce_products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ecommerce_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ecommerce_product_images" ADD CONSTRAINT "ecommerce_product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ecommerce_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ecommerce_product_variants" ADD CONSTRAINT "ecommerce_product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ecommerce_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ecommerce_inventory_movements" ADD CONSTRAINT "ecommerce_inventory_movements_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ecommerce_product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
