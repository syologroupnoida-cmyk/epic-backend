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
import { getRealStories, getSingleStory } from "../controllers/user.js";

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
 *         description: Service category ID
 *     responses:
 *       200:
 *         description: List of sub-categories
 */
router.get("/service-categories/:categoryId/sub-categories", getServiceSubCategoriesByCategory);

/**
 * @swagger
 * /public/venue-packages/popular:
 *   get:
 *     summary: Get popular venue packages (sorted by inquiry count)
 *     tags: [Public APIs]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *         description: Number of packages to return
 *     responses:
 *       200:
 *         description: List of popular venue packages
 */
router.get("/venue-packages/popular", getPopularVenuePackages);

/**
 * @swagger
 * /public/service-packages/popular:
 *   get:
 *     summary: Get popular service packages (sorted by inquiry count)
 *     tags: [Public APIs]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *         description: Number of packages to return
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
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *         description: Number of packages to return
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
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *         description: Number of packages to return
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
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by venue category ID
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city name or city ID
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum starting price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum starting price
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: boolean
 *         description: Filter by verified status
 *       - in: query
 *         name: spacePreferences
 *         schema:
 *           type: string
 *         description: Comma-separated space preference values
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
 *     parameters:
 *       - in: query
 *         name: subCategory
 *         schema:
 *           type: string
 *         description: Filter by service sub-category ID
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city name or city ID
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum starting price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum starting price
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
 *         description: Venue package slug (contains the package ID)
 *     responses:
 *       200:
 *         description: Venue package details
 *       404:
 *         description: Venue package not found
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
 *         description: Service package slug (contains the package ID)
 *     responses:
 *       200:
 *         description: Service package details
 *       404:
 *         description: Service package not found
 */
router.get("/service-packages/:slug", getServicePackage);

/**
 * @swagger
 * /public/inquiry:
 *   post:
 *     summary: Submit an inquiry / create a lead
 *     tags: [Public APIs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 description: Full name of the inquirer
 *               phone:
 *                 type: string
 *                 description: Contact phone number (required)
 *               email:
 *                 type: string
 *                 description: Contact email address
 *               location:
 *                 type: string
 *                 description: Event location (city name or address — geocoded automatically)
 *               eventDate:
 *                 type: string
 *                 format: date
 *                 description: Planned event date
 *               guestCount:
 *                 type: number
 *                 description: Expected number of guests
 *               budget:
 *                 type: number
 *                 description: Approximate budget
 *               message:
 *                 type: string
 *                 description: Additional message or requirements
 *               interestedInPackage:
 *                 type: string
 *                 description: ID of the venue/service package the user is inquiring about
 *               packageType:
 *                 type: string
 *                 enum: [VenuePackage, ServicePackage]
 *                 description: Type of the package (required when interestedInPackage is set)
 *     responses:
 *       201:
 *         description: Inquiry submitted successfully
 *       400:
 *         description: Name and phone are required
 */
router.post("/inquiry", createLead);

// Blog Routes (Public)

/**
 * @swagger
 * /public/blogs:
 *   get:
 *     summary: Get public blogs
 *     tags: [Public APIs]
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
 *         description: Filter by blog category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by blog title
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
 *         description: Blog slug
 *     responses:
 *       200:
 *         description: Public blog details
 *       404:
 *         description: Blog not found
 */
router.get("/blogs/:slug", getPublicBlog);

router.get("/real-stories", getRealStories);
router.get("/real-stories/:id", getSingleStory);

export default router;
