import express from "express";
import {
  createBlog,
  getAllBlogs,
  getBlog,
  updateBlog,
  deleteBlog,
} from "../controllers/blog.js";
import { getVendorHeaders } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/multer.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Vendor Blog
 *   description: Blog management by Vendor
 */

/**
 * @swagger
 * /blogs:
 *   post:
 *     summary: Create a new blog
 *     tags: [Vendor Blog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Blog created successfully
 *   get:
 *     summary: Get all blogs
 *     tags: [Vendor Blog]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all blogs
 */
router
  .route("/")
  .post(getVendorHeaders, upload.single("image"), createBlog)
  .get(getVendorHeaders, getAllBlogs);

/**
 * @swagger
 * /blogs/{slug}:
 *   get:
 *     summary: Get a blog by slug
 *     tags: [Vendor Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog details
 */
router.route("/:slug").get(getVendorHeaders, getBlog);

/**
 * @swagger
 * /blogs/{id}:
 *   put:
 *     summary: Update a blog
 *     tags: [Vendor Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Blog updated
 *   delete:
 *     summary: Delete a blog
 *     tags: [Vendor Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog deleted
 */
router
  .route("/:id")
  .put(getVendorHeaders, upload.single("image"), updateBlog)
  .delete(getVendorHeaders, deleteBlog);

export default router;
