# E-commerce catalogue — Phase 1

Only `ADMIN` and `SUPER_ADMIN` roles can create and manage products. Products
are unrelated to vendor service listings and no vendor can sell products.

## Test order

1. Upload product images using `POST /api/v1/uploads/image` with
   `purpose=ecommerce-product-media`. Save `url` and `publicId` from the response.
2. Create a category: `POST /api/v1/admin/ecommerce/categories`.
3. Create a draft product with at least one variant:
   `POST /api/v1/admin/ecommerce/products`.
4. Add or remove variant stock with
   `POST /api/v1/admin/ecommerce/variants/:variantId/inventory-adjustments`.
5. Publish with `POST /api/v1/admin/ecommerce/products/:productId/publish`.
6. Test the unauthenticated shop APIs under `/api/v1/shop`.

## Create category

```json
{ "name": "Bridal Wear", "description": "Wedding clothing", "sortOrder": 1 }
```

## Create product

All currency values are paise. `1299000` equals INR 12,999.00.

```json
{
  "categoryId": "{{ecommerceCategoryId}}",
  "title": "Royal Bridal Lehenga",
  "shortDescription": "Hand-embroidered bridal lehenga.",
  "description": "A detailed product description for the bridal lehenga.",
  "brandName": "Epic Collection",
  "gstPercentage": 5,
  "isFeatured": true,
  "specifications": {
    "fabric": "Silk",
    "work": "Zari embroidery",
    "blouseIncluded": true,
    "careInstructions": "Dry clean only"
  },
  "optionDefinitions": [
    { "name": "Color", "values": ["Red", "Maroon"] },
    { "name": "Size", "values": ["M", "L"] }
  ],
  "images": [
    { "url": "{{uploadedImageUrl}}", "publicId": "{{uploadedImagePublicId}}", "altText": "Royal Bridal Lehenga", "sortOrder": 0 }
  ],
  "variants": [
    { "sku": "LEH-RED-M", "optionValues": { "Color": "Red", "Size": "M" }, "mrpAmountPaise": 1599000, "saleAmountPaise": 1299000, "initialStock": 5, "isDefault": true },
    { "sku": "LEH-MAR-L", "optionValues": { "Color": "Maroon", "Size": "L" }, "mrpAmountPaise": 1649000, "saleAmountPaise": 1349000, "initialStock": 3 }
  ]
}
```

## Routes

```text
POST   /api/v1/admin/ecommerce/categories
GET    /api/v1/admin/ecommerce/categories
GET    /api/v1/admin/ecommerce/categories/:categoryId
PATCH  /api/v1/admin/ecommerce/categories/:categoryId
DELETE /api/v1/admin/ecommerce/categories/:categoryId

POST   /api/v1/admin/ecommerce/products
GET    /api/v1/admin/ecommerce/products
GET    /api/v1/admin/ecommerce/products/:productId
PATCH  /api/v1/admin/ecommerce/products/:productId
POST   /api/v1/admin/ecommerce/products/:productId/publish
POST   /api/v1/admin/ecommerce/products/:productId/archive
POST   /api/v1/admin/ecommerce/variants/:variantId/inventory-adjustments

GET /api/v1/shop/categories
GET /api/v1/shop/products
GET /api/v1/shop/products/:slug
```
