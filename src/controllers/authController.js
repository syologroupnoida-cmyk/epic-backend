import jwt from "jsonwebtoken";
import { generateAccessToken } from "../utils/generateToken.js";
import Vendor from "../models/Vendor.js";
import asyncHandler from "../utils/asyncHandler.js";
import ErrorResponse from "../utils/ErrorResponse.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";

export const refreshAccessToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new ErrorResponse(401, "Refresh token required"));
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    if (decoded.type !== "refresh") {
      return next(new ErrorResponse(401, "Invalid token type"));
    }

    let userObj = await Vendor.findById(decoded.id);
    let isAdmin = false;

    if (!userObj) {
      userObj = await Admin.findById(decoded.id);
      if (userObj) {
        isAdmin = true;
      }
    }

    if (!userObj || userObj.refreshToken !== refreshToken) {
      return next(new ErrorResponse(403, "Invalid refresh token"));
    }

    if (isAdmin && !userObj.isActive) {
      return next(new ErrorResponse(403, "Access denied. Admin account is inactive."));
    }

    // Generate new access token ONLY
    const newAccessToken = generateAccessToken(userObj._id);

    res.status(200).json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    return next(new ErrorResponse(403, "Invalid or expired refresh token"));
  }
});


export const refreshAccessTokenUser = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new ErrorResponse(401, "Refresh token required"));
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    if (decoded.type !== "refresh") {
      return next(new ErrorResponse(401, "Invalid token type"));
    }

    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return next(new ErrorResponse(403, "Invalid refresh token"));
    }

    // Generate new access token ONLY
    const newAccessToken = generateAccessToken(user._id);

    res.status(200).json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    return next(new ErrorResponse(403, "Invalid or expired refresh token"));
  }
});

