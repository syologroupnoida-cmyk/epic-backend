CREATE TABLE "ecommerce_wishlist_items" ("id" TEXT NOT NULL,"userId" TEXT NOT NULL,"productId" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "ecommerce_wishlist_items_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "ecommerce_wishlist_items_userId_productId_key" ON "ecommerce_wishlist_items"("userId","productId");
CREATE INDEX "ecommerce_wishlist_items_userId_createdAt_idx" ON "ecommerce_wishlist_items"("userId","createdAt");
ALTER TABLE "ecommerce_wishlist_items" ADD CONSTRAINT "ecommerce_wishlist_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ecommerce_wishlist_items" ADD CONSTRAINT "ecommerce_wishlist_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ecommerce_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
