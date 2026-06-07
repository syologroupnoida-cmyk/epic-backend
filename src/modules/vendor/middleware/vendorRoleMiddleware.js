import jwt from "jsonwebtoken";
import asyncHandler from "../../../utils/asyncHandler.js";
import Vendor from "../../../models/Vendor.js";
import ErrorResponse from "../../../utils/ErrorResponse.js";

/**
 * Vendor JWT middleware — validates Bearer access token and attaches vendor to req.vendorAuth
 */
export const requireVendorRole = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new ErrorResponse(401, "Please login to access this route"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    if (decoded.type !== "access") {
      return next(new ErrorResponse(401, "Invalid token type"));
    }

    const vendor = await Vendor.findById(decoded.id).select(
      "_id vendorName category city email phone role status kycStatus profile createdAt"
    );

    if (!vendor) {
      return next(new ErrorResponse(401, "Not authorized"));
    }

    if (vendor.role !== "admin" && vendor.status === "blocked") {
      return next(new ErrorResponse(403, "Your account has been blocked"));
    }

    req.vendorAuth = {
      id: vendor._id,
      brandName: vendor.vendorName,
      city: vendor.city,
      vendorType: vendor.category,
      email: vendor.email,
      mobile: vendor.phone,
      role: vendor.role,
      status: vendor.status,
      kycStatus: vendor.kycStatus || "not_started",
      profile: vendor.profile,
      createdAt: vendor.createdAt,
    };

    next();
  } catch {
    return next(new ErrorResponse(401, "Not authorized, token failed"));
  }
});

/**
 * Stricter middleware — only active vendors (for protected business routes)
 */
export const requireActiveVendor = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new ErrorResponse(401, "Please login to access this route"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    if (decoded.type !== "access") {
      return next(new ErrorResponse(401, "Invalid token type"));
    }

    const vendor = await Vendor.findById(decoded.id).select(
      "_id vendorName category city email phone role status kycStatus profile createdAt"
    );

    if (!vendor) {
      return next(new ErrorResponse(401, "Not authorized"));
    }

    if (vendor.role !== "admin" && vendor.status !== "active") {
      return next(
        new ErrorResponse(
          403,
          `Access denied. Your account status is: ${vendor.status}`
        )
      );
    }

    req.vendorAuth = {
      id: vendor._id,
      brandName: vendor.vendorName,
      city: vendor.city,
      vendorType: vendor.category,
      email: vendor.email,
      mobile: vendor.phone,
      role: vendor.role,
      status: vendor.status,
      kycStatus: vendor.kycStatus || "not_started",
      profile: vendor.profile,
      createdAt: vendor.createdAt,
    };

    next();
  } catch {
    return next(new ErrorResponse(401, "Not authorized, token failed"));
  }
});
