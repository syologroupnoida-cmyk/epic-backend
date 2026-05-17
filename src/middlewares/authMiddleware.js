import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import Vendor from "../models/Vendor.js";
import ErrorResponse from "../utils/ErrorResponse.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";

// Authentication using Headers
const getVendorHeaders = asyncHandler(async (req, _, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Verify ACCESS token (not refresh token)
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

      //  ensure it's an access token
      if (decoded.type !== "access") {
        return next(new ErrorResponse(401, "Invalid token type"));
      }

      const vendor = await Vendor.findById(decoded.id).select(
        "_id vendorName role featured status verifiedBadge lastActive autoApprovePackages subscription"
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

      const now = Date.now();

      if (!vendor.lastActive || now - vendor.lastActive > 120000) {
        vendor.lastActive = Date.now();
        try {
          await vendor.save({ validateBeforeSave: false });
        } catch (err) {
          console.error("Error updating vendor lastActive:", err.message);
        }
      }

      req.vendor = vendor;
      next();
    } catch (error) {
      return next(new ErrorResponse(401, "Not authorized, token failed"));
    }
  }

  if (!token) {
    return next(new ErrorResponse(401, "Please login to access this route"));
  }
});

const getAdminHeaders = asyncHandler(async (req, _, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      //decodes token id
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      if (decoded.type !== "access") {
        return next(new ErrorResponse(401, "Invalid token type"));
      }

      const admin = await Admin.findById(decoded.id).select(
        "_id role type isActive lastActive"
      );
      if (!admin) {
        return next(new ErrorResponse(401, "Not authorized"));
      }
      if (!admin.isActive) {
        return next(new ErrorResponse(403, "Access denied. Admin account is inactive."));
      }

      const now = Date.now();

      // update only if 2 minutes old
      if (!admin.lastActive || now - admin.lastActive > 120000) {
        admin.lastActive = Date.now();
        try {
          await admin.save({ validateBeforeSave: false });
        } catch (err) {
          console.error("Error updating admin lastActive:", err.message);
        }
      }
      req.vendor = admin;
      req.admin = admin;

      next();
    } catch (error) {
      return next(new ErrorResponse(401, "Not authorized, token failed"));
    }
  }

  if (!token) {
    return next(new ErrorResponse(401, "Please login to access this route"));
  }
});

const getUserHeaders = asyncHandler(async (req, _, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      if (decoded.type !== "access") {
        return next(new ErrorResponse(401, "Invalid token type"));
      }

      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new ErrorResponse(401, "Not authorized"));
      }

      if (!user.isActive) {
        return next(new ErrorResponse(403, "User account is inactive"));
      }

      req.user = user;
      next();
    } catch (error) {
      return next(new ErrorResponse(401, "Not authorized, token failed"));
    }
  }

  if (!token) {
    return next(new ErrorResponse(401, "Please login to access this route"));
  }
});

const getAdminCookies = asyncHandler(async (req, _, next) => {
  const token = req.cookies["adminToken"];

  if (!token) {
    return next(new ErrorResponse(401, "Not authorized"));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const admin = await Admin.findById(decoded.id).select(
    "_id fullName role type isActive lastActive"
  );
  if (!admin || !admin.isActive) {
    return next(new ErrorResponse(401, "Not authorized"));
  }

  req.vendor = admin;
  req.admin = admin;

  next();
});

export { getVendorHeaders, getUserHeaders, getAdminCookies, getAdminHeaders };
