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
 *     summary: Get marketplace leads (masked)
 *     tags: [Vendor Leads]
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: Lead purchased successfully
 */
router.post("/buy/:leadId", buyLead);

/**
 * @swagger
 * /leads/my-leads:
 *   get:
 *     summary: Get my purchased leads
 *     tags: [Vendor Leads]
 *     security:
 *       - bearerAuth: []
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
 *     summary: Buy a lead bundle
 *     tags: [Vendor Leads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bundle purchased successfully
 */
router.post("/buy-bundle", buyLeadBundle);

export default router;
