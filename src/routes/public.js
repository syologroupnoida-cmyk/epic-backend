import { Router } from "express";
import {
  getAllVenuePackages,
  getAllServicePackages,
  getServicePackage,
  getAllVenueCategories,
  getAllServiceCategories,
  getServiceSubCategoriesByCategory,
  getVenuePackage,
  createLead,
  getPublicBlogs,
  getPublicBlog,
  getPopularVenuePackages,
  getPopularServicePackages,
  getPremiumVenuePackages,
  getPremiumServicePackages,
} from "../controllers/public.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Public APIs
 *   description: Unauthenticated endpoints for public users and website visitors
 */

// Public Routes

/**
 * @swagger
 * /public/venue-categories:
 *   get:
 *     summary: Get all venue categories
 *     tags: [Public APIs]
 *     responses:
 *       200:
 *         description: List of venue categories
 */
router.get("/venue-categories", getAllVenueCategories);

/**
 * @swagger
 * /public/service-categories:
 *   get:
 *     summary: Get all service categories
 *     tags: [Public APIs]
 *     responses:
 *       200:
 *         description: List of service categories
 */
router.get("/service-categories", getAllServiceCategories);

/**
 * @swagger
 * /public/service-categories/{categoryId}/sub-categories:
 *   get:
 *     summary: Get sub-categories for a given service category
 *     tags: [Public APIs]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of sub-categories
 */
router.get("/service-categories/:categoryId/sub-categories", getServiceSubCategoriesByCategory);

/**
 * @swagger
 * /public/venue-packages/popular:
 *   get:
 *     summary: Get popular venue packages
 *     tags: [Public APIs]
 *     responses:
 *       200:
 *         description: List of popular venue packages
 */
router.get("/venue-packages/popular", getPopularVenuePackages);

/**
 * @swagger
 * /public/service-packages/popular:
 *   get:
 *     summary: Get popular service packages
 *     tags: [Public APIs]
 *     responses:
 *       200:
 *         description: List of popular service packages
 */
router.get("/service-packages/popular", getPopularServicePackages);

/**
 * @swagger
 * /public/venue-packages/premium:
 *   get:
 *     summary: Get premium venue packages
 *     tags: [Public APIs]
 *     responses:
 *       200:
 *         description: List of premium venue packages
 */
router.get("/venue-packages/premium", getPremiumVenuePackages);

/**
 * @swagger
 * /public/service-packages/premium:
 *   get:
 *     summary: Get premium service packages
 *     tags: [Public APIs]
 *     responses:
 *       200:
 *         description: List of premium service packages
 */
router.get("/service-packages/premium", getPremiumServicePackages);

/**
 * @swagger
 * /public/venue-packages:
 *   get:
 *     summary: Get all venue packages
 *     tags: [Public APIs]
 *     responses:
 *       200:
 *         description: List of all venue packages
 */
router.get("/venue-packages", getAllVenuePackages);

/**
 * @swagger
 * /public/service-packages:
 *   get:
 *     summary: Get all service packages
 *     tags: [Public APIs]
 *     responses:
 *       200:
 *         description: List of all service packages
 */
router.get("/service-packages", getAllServicePackages);

/**
 * @swagger
 * /public/venue-packages/{slug}:
 *   get:
 *     summary: Get a specific venue package by slug
 *     tags: [Public APIs]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venue package details
 */
router.get("/venue-packages/:slug", getVenuePackage);

/**
 * @swagger
 * /public/service-packages/{slug}:
 *   get:
 *     summary: Get a specific service package by slug
 *     tags: [Public APIs]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service package details
 */
router.get("/service-packages/:slug", getServicePackage);

/**
 * @swagger
 * /public/inquiry:
 *   post:
 *     summary: Create an inquiry or lead
 *     tags: [Public APIs]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Inquiry submitted successfully
 */
router.post("/inquiry", createLead);

// Blog Routes (Public)

/**
 * @swagger
 * /public/blogs:
 *   get:
 *     summary: Get public blogs
 *     tags: [Public APIs]
 *     responses:
 *       200:
 *         description: List of public blogs
 */
router.get("/blogs", getPublicBlogs);

/**
 * @swagger
 * /public/blogs/{slug}:
 *   get:
 *     summary: Get a public blog by slug
 *     tags: [Public APIs]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Public blog details
 */
router.get("/blogs/:slug", getPublicBlog);

export default router;
