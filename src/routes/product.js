import {Router } from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} from "../controllers/product.js";
import { trackSearch } from "../middlewares/trackMiddleware.js";

const router = Router();

router.post("/products", createProduct);
router.get("/products", trackSearch("product"),getProducts);
router.get("/products/active", getProducts);
router.get("/products/:id", getProductById);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

export default router;