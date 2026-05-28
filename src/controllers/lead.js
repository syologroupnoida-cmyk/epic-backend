import asyncHandler from "../utils/asyncHandler.js";
import SuccessResponse from "../utils/SuccessResponse.js";
import ErrorResponse from "../utils/ErrorResponse.js";
import Lead from "../models/Lead.js";
import LeadBundle from "../models/LeadBundle.js";
import Transaction from "../models/Transaction.js";
import Vendor from "../models/Vendor.js";
import SystemSetting from "../models/SystemSetting.js";
import VenuePackage from "../models/VenuePackage.js"; // Added for population
import ServicePackage from "../models/ServicePackage.js"; // Added for population
import VenueCategory from "../models/VenueCategory.js"; // Added for population
import ServiceSubCategory from "../models/ServiceSubCategory.js"; // Added for population
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

// Constant: Default price per lead if bought via Wallet directly
const PRICE_PER_LEAD = 50; 

const ensureVendorInteraction = (lead, vendorId) => {
  const key = String(vendorId);
  let interaction = lead.vendorInteractions?.find(
    (entry) => String(entry.vendor) === key
  );
  if (!interaction) {
    lead.vendorInteractions.push({
      vendor: vendorId,
      stage: "new",
      priority: "medium",
      notes: [],
      followUps: [],
      updatedAt: new Date(),
    });
    interaction = lead.vendorInteractions[lead.vendorInteractions.length - 1];
  }
  return interaction;
};

/* ======================================================
    VENDOR: GET MARKETPLACE LEADS (Available to buy)
====================================================== */
export const getMarketplaceLeads = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;
  const { page = 1, limit = 20, city, businessCategory } = req.query;

  const filter = {
    "purchasedBy.vendor": { $ne: vendorId },
    status: "active",
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  };
  if (city) filter["location.city"] = new RegExp(city, "i");
  if (businessCategory) filter.businessCategory = businessCategory;

  const leads = await Lead.find(filter)
    .populate({
      path: "interestedInPackage",
      select: "venueCategory serviceSubCategory",
      populate: [
        { path: "venueCategory", select: "name", strictPopulate: false },
        { path: "serviceSubCategory", select: "name", strictPopulate: false }
      ]
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .lean();

  // Mask details (They will always be unpurchased here due to filter)
  const processedLeads = leads.map((lead) => {
    return {
      _id: lead._id,
      name: lead.name,
      location: lead.location,
      eventDate: lead.eventDate,
      guestCount: lead.guestCount,
      budget: lead.budget,
      message: lead.message,
      createdAt: lead.createdAt,
      isPurchased: false, // Always false in Marketplace now
      businessCategory: lead.businessCategory || "General Inquiry",
      category: lead.category,
      price: lead.price,
      // Masked Info
      phone: "**********",
      email: "****@****.com",
    };
  });

  const total = await Lead.countDocuments(filter);

  res.status(200).json(
    new SuccessResponse(200, "Leads fetched", {
      total,
      page,
      limit,
      leads: processedLeads,
      pricePerLead: PRICE_PER_LEAD
    })
  );
});

/* ======================================================
    VENDOR: BUY SINGLE LEAD
====================================================== */
export const buyLead = asyncHandler(async (req, res, next) => {
  const { leadId } = req.params;
  const { useCredits } = req.body;
  const vendorId = req.vendor._id;

  const lead = await Lead.findById(leadId);

  if (!lead) return next(new ErrorResponse(404, "Lead not found"));

  // ADMIN STOP CHECK
  if (lead.status === "stopped") {
    return next(new ErrorResponse(400, "This lead has been stopped by admin"));
  }

  // EXPIRY CHECK
  if (lead.expiresAt && new Date() > lead.expiresAt) {
    return next(
      new ErrorResponse(400, "This lead has expired and cannot be purchased")
    );
  }

  // Check if already purchased
  const alreadyPurchased = lead.purchasedBy.some(
    (p) => p.vendor.toString() === vendorId.toString()
  );

  if (alreadyPurchased) {
    return res
      .status(200)
      .json(new SuccessResponse(200, "Lead already purchased", lead));
  }

  const vendor = await Vendor.findById(vendorId);
  if (!vendor) return next(new ErrorResponse(404, "Vendor not found"));

  const leadCategory = (lead.category || "standard").toLowerCase();

  // ===============================
  // CREDIT PURCHASE LOGIC
  // ===============================

  if (useCredits) {
    // Fetch Dynamic Cost
    const settings = await SystemSetting.findOne({ key: "lead_costs" }).lean();
    const costs = settings?.value || {};

    const tierData = costs[leadCategory] || costs["standard"];

    let rawCost =
      typeof tierData === "object" ? tierData.credits : tierData;

    let cost = Number(rawCost);
    if (isNaN(cost)) cost = 10;

    const now = new Date();

    let subscriptionCredits = 0;

    if (
      vendor.subscription &&
      vendor.subscription.expiresAt &&
      vendor.subscription.expiresAt > now
    ) {
      subscriptionCredits = Number(vendor.subscription.leadCredits) || 0;
    }

    const normalCredits = Number(vendor.leadCredits) || 0;

    const totalCredits = subscriptionCredits + normalCredits;

    if (totalCredits < cost) {
      return next(
        new ErrorResponse(
          400,
          `Insufficient credits. Lead costs ${cost}. Available ${totalCredits}.`
        )
      );
    }

    // Deduct credits (subscription first)
    if (subscriptionCredits >= cost) {
      await Vendor.findByIdAndUpdate(
        vendorId,
        { $inc: { "subscription.leadCredits": -cost } },
        { new: true }
      );
    } else {
      const remaining = cost - subscriptionCredits;

      await Vendor.findByIdAndUpdate(
        vendorId,
        {
          $inc: {
            "subscription.leadCredits": -subscriptionCredits,
            leadCredits: -remaining,
          },
        },
        { new: true }
      );
    }

    // Atomic purchase record
    const updatedLead = await Lead.findOneAndUpdate(
      {
        _id: leadId,
        "purchasedBy.vendor": { $ne: vendorId },
      },
      {
        $push: {
          purchasedBy: {
            vendor: vendorId,
            pricePaid: 0,
            method: "credit",
            meta: { creditCost: cost },
          },
        },
      },
      { new: true }
    );

    if (!updatedLead) {
      return next(
        new ErrorResponse(400, "Lead already purchased or unavailable")
      );
    }
  }

  // ===============================
  // WALLET PAYMENT LOGIC
  // ===============================

  else {
    if (vendor.wallet.balance < lead.price) {
      return next(new ErrorResponse(400, "Insufficient wallet balance"));
    }

    const transaction = await Transaction.create({
      vendor: vendorId,
      type: "debit",
      gateway: "internal",
      orderId: `order_${uuidv4().replace(/-/g, "").substring(0, 14)}`,
      amount: lead.price,
      currency: "INR",
      status: "success",
      method: "wallet",
      meta: { description: `Purchased ${lead.category} Lead ${leadId}` },
    });

    const updatedVendor = await Vendor.findByIdAndUpdate(
      vendorId,
      {
        $inc: { "wallet.balance": -lead.price },
        $push: { "wallet.transactions": transaction._id },
      },
      { new: true }
    );

    // Safety rollback check
    if (updatedVendor.wallet.balance < 0) {
      await Vendor.findByIdAndUpdate(vendorId, {
        $inc: { "wallet.balance": lead.price },
        $pull: { "wallet.transactions": transaction._id },
      });

      await Transaction.findByIdAndDelete(transaction._id);

      return next(
        new ErrorResponse(400, "Insufficient wallet balance (transaction failed)")
      );
    }

    const updatedLead = await Lead.findOneAndUpdate(
      {
        _id: leadId,
        "purchasedBy.vendor": { $ne: vendorId },
      },
      {
        $push: {
          purchasedBy: {
            vendor: vendorId,
            pricePaid: lead.price,
            method: "wallet",
          },
        },
      },
      { new: true }
    );

    if (!updatedLead) {
      return next(
        new ErrorResponse(400, "Lead already purchased or unavailable")
      );
    }

    vendor.wallet.balance = updatedVendor.wallet.balance;
  }

  const updatedVendor = await Vendor.findById(vendorId);

  res.status(200).json(
    new SuccessResponse(200, "Lead purchased successfully", {
      leadId,
      leadCredits: updatedVendor.leadCredits,
      subscriptionCredits:
        updatedVendor.subscription?.leadCredits || 0,
      walletBalance: updatedVendor.wallet.balance,
    })
  );
});
/* ======================================================
    VENDOR: GET ALL PURCHASED LEADS
====================================================== */
export const getMyLeads = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;
  const { page = 1, limit = 20 } = req.query;

  const leads = await Lead.find({ "purchasedBy.vendor": vendorId })
    .populate({
      path: "interestedInPackage",
      select: "venueCategory serviceSubCategory",
      populate: [
        { path: "venueCategory", select: "name", strictPopulate: false },
        { path: "serviceSubCategory", select: "name", strictPopulate: false }
      ]
    })
    .sort({ "purchasedBy.purchasedAt": -1 }) // Sort by purchase time
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .lean();

  // Process leads to match frontend structure
  const processedLeads = leads.map((lead) => {
    const interaction = lead.vendorInteractions?.find(
      (entry) => String(entry.vendor) === String(vendorId)
    );
    return {
      ...lead,
      isPurchased: true, // Explicitly set for UI to show "Unlocked" state
      businessCategory: lead.businessCategory || "General Inquiry",
      crm: {
        stage: interaction?.stage || "new",
        priority: interaction?.priority || "medium",
        notesCount: interaction?.notes?.length || 0,
        followUpsCount: interaction?.followUps?.length || 0,
      },
    };
  });

  const total = await Lead.countDocuments({ "purchasedBy.vendor": vendorId });

  res.status(200).json(
    new SuccessResponse(200, "My purchased leads", {
      total,
      page,
      limit,
      leads: processedLeads,
    })
  );
});

/* ======================================================
    VENDOR: BUY LEAD BUNDLE (Bulk Credits)
====================================================== */
export const getLeadBundles = asyncHandler(async (req, res) => {
  const bundles = await LeadBundle.find({ isActive: true });
  res.status(200).json(new SuccessResponse(200, "Lead bundles", bundles));
});

export const buyLeadBundle = asyncHandler(async (req, res, next) => {
  const { bundleId } = req.body;
  const vendorId = req.vendor._id;

  const bundle = await LeadBundle.findById(bundleId);
  if (!bundle) return next(new ErrorResponse(404, "Bundle not found"));

  const vendor = await Vendor.findById(vendorId);

  // Check Balance
  if (vendor.wallet.balance < bundle.price) {
    return next(new ErrorResponse(400, "Insufficient wallet balance"));
  }

  // Deduct Wallet & Add Credits Atomically
  const updatedVendor = await Vendor.findByIdAndUpdate(
      vendorId,
      { 
          $inc: { 
              "wallet.balance": -bundle.price,
              "leadCredits": bundle.credits 
          }
      },
      { new: true }
  );

  vendor.leadCredits = updatedVendor.leadCredits;
  vendor.wallet.balance = updatedVendor.wallet.balance;

  // Create Transaction
  const transaction = await Transaction.create({
    vendor: vendorId,
    type: "debit",
    gateway: "internal",
    orderId: `order_${uuidv4().replace(/-/g, "").substring(0, 14)}`,
    amount: bundle.price,
    currency: "INR",
    status: "success",
    method: "wallet",
    meta: {
      description: `Purchased Bundle: ${bundle.name} (${bundle.credits} Credits)`,
    },
  });

  vendor.wallet.transactions.push(transaction._id);
  await vendor.save(); // Just to save transaction ref, balance is already updated

  res.status(200).json(
    new SuccessResponse(200, "Bundle purchased successfully", {
      leadCredits: vendor.leadCredits,
      walletBalance: vendor.wallet.balance,
    })
  );
});

/* ======================================================
    ADMIN: CREATE LEAD BUNDLE
====================================================== */
export const createLeadBundle = asyncHandler(async(req, res) => {
  const isAdmin = req.vendor && req.vendor.role === "admin";

  if (!isAdmin) {
    return next(new ErrorResponse(403, "Access denied. Admins only."));
  }
    const bundle = await LeadBundle.create(req.body);
    res.status(201).json(new SuccessResponse(201, "Bundle created", bundle));
});

/* ======================================================
    COMMON: GET FILTER OPTIONS (Business Categories)
====================================================== */
export const getLeadFilterOptions = asyncHandler(async (req, res) => {
  const categories = await Lead.distinct("businessCategory");
  res.status(200).json(new SuccessResponse(200, "Filter options", { categories }));
});

/* ======================================================
   VENDOR CRM: UPDATE LEAD STAGE & PRIORITY
====================================================== */
export const updateLeadInteraction = asyncHandler(async (req, res, next) => {
  const { leadId } = req.params;
  const { stage, priority } = req.body;
  const vendorId = req.vendor._id;

  const lead = await Lead.findOne({
    _id: leadId,
    "purchasedBy.vendor": vendorId,
  });
  if (!lead) return next(new ErrorResponse(404, "Lead not found"));

  const interaction = ensureVendorInteraction(lead, vendorId);
  if (stage) interaction.stage = stage;
  if (priority) interaction.priority = priority;
  interaction.updatedAt = new Date();

  await lead.save();
  res
    .status(200)
    .json(new SuccessResponse(200, "Lead CRM details updated", interaction));
});

export const addLeadNote = asyncHandler(async (req, res, next) => {
  const { leadId } = req.params;
  const { text } = req.body;
  const vendorId = req.vendor._id;
  if (!text?.trim()) return next(new ErrorResponse(400, "Note text is required"));

  const lead = await Lead.findOne({
    _id: leadId,
    "purchasedBy.vendor": vendorId,
  });
  if (!lead) return next(new ErrorResponse(404, "Lead not found"));

  const interaction = ensureVendorInteraction(lead, vendorId);
  interaction.notes.push({ text: text.trim() });
  interaction.updatedAt = new Date();
  await lead.save();

  res.status(200).json(new SuccessResponse(200, "Note added", interaction));
});

export const addLeadFollowUp = asyncHandler(async (req, res, next) => {
  const { leadId } = req.params;
  const { title, dueAt } = req.body;
  const vendorId = req.vendor._id;
  if (!title?.trim() || !dueAt) {
    return next(new ErrorResponse(400, "Title and dueAt are required"));
  }

  const lead = await Lead.findOne({
    _id: leadId,
    "purchasedBy.vendor": vendorId,
  });
  if (!lead) return next(new ErrorResponse(404, "Lead not found"));

  const interaction = ensureVendorInteraction(lead, vendorId);
  interaction.followUps.push({
    _id: new mongoose.Types.ObjectId(),
    title: title.trim(),
    dueAt: new Date(dueAt),
    done: false,
  });
  interaction.updatedAt = new Date();
  await lead.save();

  res.status(200).json(new SuccessResponse(200, "Follow-up added", interaction));
});

export const toggleLeadFollowUp = asyncHandler(async (req, res, next) => {
  const { leadId, followUpId } = req.params;
  const vendorId = req.vendor._id;

  const lead = await Lead.findOne({
    _id: leadId,
    "purchasedBy.vendor": vendorId,
  });
  if (!lead) return next(new ErrorResponse(404, "Lead not found"));

  const interaction = ensureVendorInteraction(lead, vendorId);
  const followUp = interaction.followUps.id(followUpId);
  if (!followUp) return next(new ErrorResponse(404, "Follow-up not found"));

  followUp.done = !followUp.done;
  interaction.updatedAt = new Date();
  await lead.save();

  res.status(200).json(new SuccessResponse(200, "Follow-up updated", interaction));
});
