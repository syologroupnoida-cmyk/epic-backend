import { Router } from "express";
import { getVendorHeaders } from "../middlewares/authMiddleware.js";
import {
  getMarketplaceLeads,
  buyLead,
  getMyLeads,
  getLeadBundles,
  buyLeadBundle,
  getLeadFilterOptions
} from "../controllers/lead.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Vendor Leads
 *   description: Lead purchasing and management for vendors
 */

router.use(getVendorHeaders);

/**
 * @swagger
 * /leads/filters:
 *   get:
 *     summary: Get lead filter options
 *     tags: [Vendor Leads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Filter options retrieved
 */
router.get("/filters", getLeadFilterOptions);

/**
 * @swagger
 * /leads/marketplace:
 *   get:
 *     summary: Get marketplace leads (contact details masked)
 *     tags: [Vendor Leads]
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
 *           default: 20
 *         description: Results per page
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: businessCategory
 *         schema:
 *           type: string
 *         description: Filter by business category
 *     responses:
 *       200:
 *         description: Marketplace leads retrieved
 */
router.get("/marketplace", getMarketplaceLeads);

/**
 * @swagger
 * /leads/buy/{leadId}:
 *   post:
 *     summary: Buy a single lead
 *     tags: [Vendor Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the lead to purchase
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - useCredits
 *             properties:
 *               useCredits:
 *                 type: boolean
 *                 description: If true, pay using lead credits; if false, pay using wallet balance
 *     responses:
 *       200:
 *         description: Lead purchased successfully
 *       400:
 *         description: Insufficient credits or wallet balance / lead already purchased or expired
 *       404:
 *         description: Lead or vendor not found
 */
router.post("/buy/:leadId", buyLead);

/**
 * @swagger
 * /leads/my-leads:
 *   get:
 *     summary: Get my purchased leads (full contact details)
 *     tags: [Vendor Leads]
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
 *           default: 20
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Purchased leads retrieved
 */
router.get("/my-leads", getMyLeads);

/**
 * @swagger
 * /leads/bundles:
 *   get:
 *     summary: Get lead bundles
 *     tags: [Vendor Leads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lead bundles retrieved
 */
router.get("/bundles", getLeadBundles);

/**
 * @swagger
 * /leads/buy-bundle:
 *   post:
 *     summary: Buy a lead bundle (deducts from wallet, adds lead credits)
 *     tags: [Vendor Leads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bundleId
 *             properties:
 *               bundleId:
 *                 type: string
 *                 description: ID of the lead bundle to purchase
 *     responses:
 *       200:
 *         description: Bundle purchased successfully
 *       400:
 *         description: Insufficient wallet balance
 *       404:
 *         description: Bundle not found
 */
router.post("/buy-bundle", buyLeadBundle);

export default router;
