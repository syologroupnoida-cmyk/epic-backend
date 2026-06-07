import asyncHandler from "../utils/asyncHandler.js";
import ErrorResponse from "../utils/ErrorResponse.js";
import SuccessResponse from "../utils/SuccessResponse.js";
import SystemSetting from "../models/SystemSetting.js";
import VenuePackage from "../models/VenuePackage.js";
import ServicePackage from "../models/ServicePackage.js";
import Vendor from "../models/Vendor.js";
import Lead from "../models/Lead.js";
import Contact from "../models/contact.js";
import RealStory from "../models/realStory.js";
import Admin from "../models/Admin.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";
import {
  parseVendorSpreadsheet,
  bulkImportVendors,
} from "../services/vendorBulkImportService.js";
// Default Costs
const DEFAULT_LEAD_COSTS = {
  standard: 10,
  premium: 25,
  elite: 50,
};

const isAdminUser = (req) =>
  Boolean(req.admin || (req.vendor && req.vendor.role === "admin"));

export const getSystemSettings = asyncHandler(async (req, res, next) => {
  if (!isAdminUser(req)) {
    return next(new ErrorResponse(403, "Access denied. Admins only."));
  }

  const { key } = req.params;
  let setting = await SystemSetting.findOne({ key });

  // If asking for lead_costs and not found, return default
  if (key === "lead_costs" && !setting) {
    return res.status(200).json(
      new SuccessResponse(200, "Settings fetched (default)", DEFAULT_LEAD_COSTS)
    );
  }

  if (!setting) {
    return res.status(200).json(new SuccessResponse(200, "Setting not found", null));
  }

  res.status(200).json(new SuccessResponse(200, "Settings fetched", setting.value));
});

export const updateSystemSettings = asyncHandler(async (req, res, next) => {
  if (!isAdminUser(req)) {
    return next(new ErrorResponse(403, "Access denied. Admins only."));
  }
  const { key } = req.params;
  const { value } = req.body;

  const setting = await SystemSetting.findOneAndUpdate(
    { key },
    { value },
    { new: true, upsert: true }
  );

  res.status(200).json(new SuccessResponse(200, "Settings updated", setting.value));
});

export const checkAdmin = asyncHandler(async (req, res, next) => {
  if (!isAdminUser(req)) {
    return next(new ErrorResponse(403, "Access denied. Admins only."));
  }

  return res
    .status(200)
    .json(new SuccessResponse(200, "Admin check successful", { isAdmin: true }));
});

/* ======================================================
    ADMIN: GET ALL VENUE PACKAGES (With Filters)
====================================================== */
export const getAdminVenuePackages = asyncHandler(async (req, res, next) => {
  if (!isAdminUser(req)) {
    return next(new ErrorResponse(403, "Access denied. Admins only."));
  }
  const { page = 1, limit = 10, status, search, vendor } = req.query;

  const filter = {};

  if (status === "pending") filter.approved = false;
  if (status === "approved") filter.approved = true;
  // If status is 'all' or undefined, show all

  if (search) {
    filter.title = { $regex: search, $options: "i" };
  }

  if (vendor) {
    filter.vendor = vendor;
  }

  const packages = await VenuePackage.find(filter)
    .populate("vendor", "vendorName email phone")
    .populate("venueCategory", "name")
    .populate("location.city", "name")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await VenuePackage.countDocuments(filter);

  res.status(200).json(
    new SuccessResponse(200, "Admin Venue Packages", {
      packages,
      total,
      page,
      limit,
    })
  );
});

/* ======================================================
    ADMIN: GET ALL SERVICE PACKAGES (With Filters)
====================================================== */
export const getAdminServicePackages = asyncHandler(async (req, res, next) => {
  if (!isAdminUser(req)) {
    return next(new ErrorResponse(403, "Access denied. Admins only."));
  }
  const { page = 1, limit = 10, status, search, vendor } = req.query;

  const filter = {};

  if (status === "pending") filter.approved = false;
  if (status === "approved") filter.approved = true;

  if (search) {
    filter.title = { $regex: search, $options: "i" };
  }

  if (vendor) {
    filter.vendor = vendor;
  }

  const packages = await ServicePackage.find(filter)
    .populate("vendor", "vendorName email phone")
    .populate("serviceSubCategory", "name")
    .populate("location.city", "name")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await ServicePackage.countDocuments(filter);

  res.status(200).json(
    new SuccessResponse(200, "Admin Service Packages", {
      packages,
      total,
      page,
      limit,
    })
  );
});

/* ======================================================
    ADMIN: UPDATE PACKAGE STATUS (Approve/Reject)
====================================================== */
export const updateVenuePackageStatus = asyncHandler(async (req, res, next) => {
  const isAdmin = req.admin || (req.vendor && req.vendor.role === "admin");

  if (!isAdmin) {
    return next(new ErrorResponse(403, "Access denied. Admins only."));
  }
  const { id } = req.params;
  const { approved, visibility } = req.body;

  const pkg = await VenuePackage.findById(id);
  if (!pkg) return next(new ErrorResponse(404, "Package not found"));

  if (approved !== undefined) pkg.approved = approved;
  if (visibility !== undefined) pkg.visibility = visibility;

  await pkg.save();

  res.status(200).json(new SuccessResponse(200, "Package status updated", pkg));
});

export const updateServicePackageStatus = asyncHandler(async (req, res, next) => {
  const isAdmin = req.admin || (req.vendor && req.vendor.role === "admin");

  if (!isAdmin) {
    return next(new ErrorResponse(403, "Access denied. Admins only."));
  }
  const { id } = req.params;
  const { approved, visibility } = req.body;

  const pkg = await ServicePackage.findById(id);
  if (!pkg) return next(new ErrorResponse(404, "Package not found"));

  if (approved !== undefined) pkg.approved = approved;
  if (visibility !== undefined) pkg.visibility = visibility;

  await pkg.save();

  res.status(200).json(new SuccessResponse(200, "Package status updated", pkg));
});

/* ======================================================
    ADMIN: BULK CREATE VENDORS
====================================================== */
export const bulkCreateVendors = asyncHandler(async (req, res, next) => {
  const isAdmin = req.admin || (req.vendor && req.vendor.role === "admin");

  if (!isAdmin) {
    return next(new ErrorResponse(403, "Access denied. Admins only."));
  }

  const vendorsData = req.body;

  if (!Array.isArray(vendorsData) || vendorsData.length === 0) {
    return next(new ErrorResponse(400, "No vendor data provided or data is not in an array"));
  }

  const results = await bulkImportVendors(vendorsData);

  res.status(201).json(new SuccessResponse(201, "Bulk vendor processing complete.", results));
});

export const bulkUploadVendors = asyncHandler(async (req, res, next) => {
  const isAdmin = req.admin || (req.vendor && req.vendor.role === "admin");

  if (!isAdmin) {
    return next(new ErrorResponse(403, "Access denied. Admins only."));
  }

  if (!req.file) {
    return next(new ErrorResponse(400, "CSV or Excel file is required"));
  }

  const allowedTypes = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  const fileName = req.file.originalname?.toLowerCase() || "";
  const isSpreadsheet =
    allowedTypes.includes(req.file.mimetype) ||
    fileName.endsWith(".csv") ||
    fileName.endsWith(".xlsx") ||
    fileName.endsWith(".xls");

  if (!isSpreadsheet) {
    return next(
      new ErrorResponse(400, "Invalid file type. Upload .csv, .xlsx, or .xls")
    );
  }

  const rows = parseVendorSpreadsheet(req.file.buffer);
  const results = await bulkImportVendors(rows);

  res.status(201).json(
    new SuccessResponse(201, "Vendor file processed successfully.", results)
  );
});

export const toggleLeadStatus = asyncHandler(async (req, res, next) => {
  const { leadId ,status } = req.body; // "active" or "stopped"

  if (!["active", "stopped"].includes(status)) {
    return next(new ErrorResponse(400, "Invalid status value"));
  }

  const lead = await Lead.findById(leadId);
  if (!lead) return next(new ErrorResponse(404, "Lead not found"));

  lead.status = status;
  await lead.save();

  res.status(200).json(
    new SuccessResponse(200, `Lead status updated to ${status}`, lead)
  );
});


export const getAllContacts = async (req, res) => {
  try {
    let { page = 1, limit = 10, search } = req.query;

    page = Math.max(1, Number(page) || 1);
    limit = Math.max(1, Math.min(100, Number(limit) || 10));

    const filter = {};

    if (search) {
      filter.email = { $regex: search, $options: "i" };
    }

    const [contacts, total] = await Promise.all([
      Contact.find(filter)
        .populate("user", "name email") // optional
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),

      Contact.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      count: contacts.length,
      data: contacts,
    });
  } catch (err) {
    console.error("Admin Contact Fetch Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const toggleFeaturedStory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const story = await RealStory.findById(id);

  if (!story) {
    return res.status(404).json({
      success: false,
      message: "Story not found",
    });
  }

  story.isFeatured = !story.isFeatured;
  await story.save();

  res.status(200).json({
    success: true,
    message: `Story is now ${story.isFeatured ? "FEATURED" : "NOT FEATURED"}`,
  });
});

/* ======================================================
    ADMIN AUTH: LOGIN
====================================================== */
export const adminLogin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse(400, "Email and password are required"));
  }

  const admin = await Admin.findOne({ email }).select("+password");

  if (!admin || !(await admin.isPasswordCorrect(password))) {
    return next(new ErrorResponse(401, "Invalid login details"));
  }

  if (!admin.isActive) {
    return next(new ErrorResponse(403, "Access denied. Your account is inactive."));
  }

  const accessToken = generateAccessToken(admin._id);
  const refreshToken = generateRefreshToken(admin._id);
  
  admin.refreshToken = refreshToken;
  await admin.save({ validateBeforeSave: false });

  const adminObj = admin.toObject();
  delete adminObj.password;
  delete adminObj.refreshToken;

  return res.status(200).json(
    new SuccessResponse(200, "Login successful", {
      admin: adminObj,
      accessToken,
      refreshToken,
    })
  );
});

/* ======================================================
    ADMIN AUTH: CREATE NEW ADMIN (Superadmin Only)
====================================================== */
export const createAdmin = asyncHandler(async (req, res, next) => {
  const isSuperAdmin = req.vendor && req.vendor.role === "admin" && req.vendor.type === "superadmin";

  if (!isSuperAdmin) {
    return next(new ErrorResponse(403, "Access denied. Superadmins only."));
  }

  const { fullName, email, password, phone, type } = req.body;

  if (!fullName || !email || !password) {
    return next(new ErrorResponse(400, "Full name, email, and password are required"));
  }

  const adminExists = await Admin.exists({ email });
  if (adminExists) {
    return next(new ErrorResponse(400, "Admin with this email already exists"));
  }

  const admin = await Admin.create({
    fullName,
    email,
    password,
    phone,
    type: type || "superadmin",
  });

  const adminObj = admin.toObject();
  delete adminObj.password;

  return res.status(201).json(
    new SuccessResponse(201, "Admin created successfully", { admin: adminObj })
  );
});