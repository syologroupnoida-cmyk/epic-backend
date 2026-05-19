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
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - content
 *               - excerpt
 *               - image
 *             properties:
 *               title:
 *                 type: string
 *                 description: Blog title
 *               category:
 *                 type: string
 *                 description: Blog category
 *               content:
 *                 type: string
 *                 description: Full blog content
 *               excerpt:
 *                 type: string
 *                 description: Short summary of the blog
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Cover image (required)
 *     responses:
 *       201:
 *         description: Blog created successfully
 *       400:
 *         description: Required fields missing or image not provided
 *   get:
 *     summary: Get all blogs
 *     tags: [Vendor Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Results per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by blog title
 *       - in: query
 *         name: vendorId
 *         schema:
 *           type: string
 *         description: Filter by vendor ID (admin only)
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
 *         description: Blog slug (contains the blog ID)
 *     responses:
 *       200:
 *         description: Blog details
 *       403:
 *         description: Not authorized to view this blog
 *       404:
 *         description: Blog not found
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
 *         description: Blog ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Blog title
 *               category:
 *                 type: string
 *                 description: Blog category
 *               content:
 *                 type: string
 *                 description: Full blog content
 *               excerpt:
 *                 type: string
 *                 description: Short summary of the blog
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Replacement cover image (optional)
 *     responses:
 *       200:
 *         description: Blog updated
 *       403:
 *         description: Not authorized to update this blog
 *       404:
 *         description: Blog not found
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
 *         description: Blog ID
 *     responses:
 *       200:
 *         description: Blog deleted
 *       403:
 *         description: Not authorized to delete this blog
 *       404:
 *         description: Blog not found
 */
router
  .route("/:id")
  .put(getVendorHeaders, upload.single("image"), updateBlog)
  .delete(getVendorHeaders, deleteBlog);

export default router;
