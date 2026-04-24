import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";
import ErrorResponse from "../utils/ErrorResponse.js";
import SuccessResponse from "../utils/SuccessResponse.js";
import {generateAccessToken,generateRefreshToken} from "../utils/generateToken.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { client } from "../config/googleClient.js";

import redis from "../config/redisClient.js";
import { generateOtp } from "../utils/helper.js";
import { sendOtpSms } from "../utils/smsService.js";
import Vendor from "../models/Vendor.js";
import VenuePackage from "../models/VenuePackage.js";
import ServicePackage from "../models/ServicePackage.js";
import Contact from "../models/contact.js";
// @desc    Register a new user
// @route   POST /api/v1/user/register
// @access  Public
export const registerUser = asyncHandler(async (req, res, next) => {
  const { fullName, email, password, phone } = req.body;

  if (!fullName || !email || !password) {
    return next(new ErrorResponse(400, "Please provide all required fields"));
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return next(new ErrorResponse(400, "User already exists"));
  }

  let profile = {
    public_id: "default_user",
    url: "https://res.cloudinary.com/demo/image/upload/v1570979139/book_covers/default_user.jpg",
  };

  if (req.file) {
    const uploaded = await uploadToCloudinary([req.file]);
    if (uploaded && uploaded.length > 0) {
      profile = {
        public_id: uploaded[0].public_id,
        url: uploaded[0].url,
      };
    }
  }

  const user = await User.create({
    fullName,
    email,
    password,
    phone,
    profile,
  });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });


  res.status(201).json(
    new SuccessResponse(201, "User registered successfully", {
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profile: user.profile,
        role: user.role,
        refreshToken: user.refreshToken,
      },
      accessToken,
    })
  );
});

// @desc    Login user
// @route   POST /api/v1/user/login
// @access  Public
export const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse(400, "Please provide email and password"));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorResponse(401, "Invalid credentials"));
  }

  const isMatch = await user.isPasswordCorrect(password);

  if (!isMatch) {
    return next(new ErrorResponse(401, "Invalid credentials"));
  }

  if (!user.isActive) {
    return next(new ErrorResponse(403, "Your account is inactive"));
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  res.status(200).json(
    new SuccessResponse(200, "Login successful", {
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profile: user.profile,
        role: user.role,
        refreshToken: user.refreshToken,
      },
      accessToken,
    })
  );
});

// @desc    Get user profile
// @route   GET /api/v1/user/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ErrorResponse(404, "User not found"));
  }

  res.status(200).json(new SuccessResponse(200, "User profile", user));
});

// @desc    Update user profile
// @route   PUT /api/v1/user/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id); // Use :id since admin route

  if (!user) {
    return next(new ErrorResponse(404, "User not found"));
  }

  const { fullName, phone, isActive } = req.body;

  // Update basic fields
  if (fullName !== undefined) user.fullName = fullName;
  if (phone !== undefined) user.phone = phone;

  if (isActive !== undefined) {
    if (typeof isActive !== "boolean") {
      return next(new ErrorResponse(400, "isActive must be true or false"));
    }
    user.isActive = isActive;
  }

  // Profile image upload (existing logic)
  if (req.file) {
    const uploaded = await uploadToCloudinary([req.file]);
    if (uploaded && uploaded.length > 0) {
      user.profile = {
        public_id: uploaded[0].public_id,
        url: uploaded[0].url,
      };
    }
  }

  await user.save();

  res.status(200).json(new SuccessResponse(200, "Profile updated", user));
});

// @desc    Google Login/Signup
// @route   POST /api/v1/user/google-auth
// @access  Public
export const googleAuth = asyncHandler(async (req, res, next) => {
  const { code, redirect_uri } = req.body;

  // Validation
  if (!code || typeof code !== 'string' || code.trim() === '') {
    return next(new ErrorResponse(400, "Valid Google authorization code is required"));
  }

  // Validate environment variables
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error("CRITICAL: Google OAuth credentials missing in environment");
    return next(new ErrorResponse(500, "Authentication service unavailable"));
  }

  let tokens, payload, user;

  try {
    // Step 1: Exchange code for tokens
    try {
      const tokenResponse = await client.getToken({
        code: code.trim(),
        redirect_uri: redirect_uri && typeof redirect_uri === 'string' 
          ? redirect_uri.trim() 
          : "postmessage",
      });
      tokens = tokenResponse.tokens;

      if (!tokens || !tokens.id_token) {
        throw new Error("Invalid token response from Google");
      }
    } catch (tokenError) {
      console.error("Token Exchange Error:", tokenError?.response?.data || tokenError.message);
      return next(new ErrorResponse(400, "Invalid or expired authorization code"));
    }

    // Step 2: Verify ID token
    try {
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();

      if (!payload || !payload.sub || !payload.email) {
        throw new Error("Invalid token payload");
      }
    } catch (verifyError) {
      console.error("Token Verification Error:", verifyError.message);
      return next(new ErrorResponse(401, "Invalid Google token"));
    }

    // Step 3: Prepare Google data
    const googleData = {
      googleId: payload.sub,
      fullName: payload.name || payload.email.split('@')[0], // Fallback if name missing
      email: payload.email.toLowerCase().trim(),
      profilePic: payload.picture || null,
    };

    // Step 4: Find or create user
    try {
      user = await User.findOne({ email: googleData.email }).select('+refreshToken');

      if (user) {
        // Update existing user
        if (!user.googleId) {
          user.googleId = googleData.googleId;
        }
        
        // Update profile pic if missing or from Google
        if (googleData.profilePic && (!user.profile?.url || user.profile?.public_id === "google_profile")) {
          user.profile = {
            public_id: "google_profile",
            url: googleData.profilePic,
          };
        }

        await user.save({ validateBeforeSave: false });
      } else {
        // Create new user
        user = await User.create({
          fullName: googleData.fullName,
          email: googleData.email,
          googleId: googleData.googleId,
          profile: {
            public_id: "google_profile",
            url: googleData.profilePic,
          },
          isActive: true, // Explicitly set active for Google users
        });
      }
    } catch (dbError) {
      console.error("Database Error:", dbError.message);
      
      // Handle duplicate email error
      if (dbError.code === 11000) {
        return next(new ErrorResponse(409, "An account with this email already exists"));
      }
      
      return next(new ErrorResponse(500, "Failed to process user account"));
    }

    // Step 5: Check account status
    if (!user || user.isActive === false) {
      return next(new ErrorResponse(403, "Your account is inactive. Please contact support."));
    }

    // Step 6: Generate tokens
    let accessToken, refreshToken;
    try {
      accessToken = generateAccessToken(user._id);
      refreshToken = generateRefreshToken(user._id);

      if (!accessToken || !refreshToken) {
        throw new Error("Token generation returned null/undefined");
      }
    } catch (tokenGenError) {
      console.error("Token Generation Error:", tokenGenError.message);
      return next(new ErrorResponse(500, "Failed to generate authentication tokens"));
    }

    // Step 7: Save refresh token
    try {
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });
    } catch (saveError) {
      console.error("Refresh Token Save Error:", saveError.message);
      // Non-critical - continue with login
    }

    // Step 8: Send response
    return res.status(200).json(
      new SuccessResponse(200, "Login successful", {
        user: {
          _id: user._id,
          fullName: user.fullName || "User",
          email: user.email,
          profile: user.profile || { public_id: "", url: "" },
          role: user.role || "user",
        },
        accessToken,
        refreshToken,
      })
    );

  } catch (error) {
    // Catch-all for unexpected errors
    console.error("Unexpected Google Auth Error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return next(
      new ErrorResponse(
        500,
        "An unexpected error occurred during authentication. Please try again."
      )
    );
  }
});


// Send forget OTP
// Forget password - send OTP
export const sendForgotPasswordOtp = asyncHandler(async (req, res, next) => {
  const { phone } = req.body;

  if (!phone || !/^[6-9]\d{9}$/.test(phone))
    return next(new ErrorResponse(400, "Invalid phone number"));

  const user = await User.findOne({ phone });
  if (!user) return next(new ErrorResponse(404, "User not found"));

  // Prevent resending too fast
  if (await redis.get(`forget_password_otp:${phone}`)) {
    return next(new ErrorResponse(400, "OTP already sent. Please wait."));
  }

  const otp = generateOtp();
  await redis.setex(`forget_password_otp:${phone}`, 300, otp); // expires in 5 min

  await sendOtpSms(phone, otp, "password reset");
  res.status(200).json(new SuccessResponse(200, "OTP sent successfully"));
});

// Verify OTP for forget password
export const verifyForgotPasswordOtp = asyncHandler(async (req, res, next) => {
  const { phone, otp } = req.body;

  const storedOtp = await redis.get(`forget_password_otp:${phone}`);
  if (!storedOtp) return next(new ErrorResponse(400, "OTP expired or invalid"));
  if (storedOtp !== otp) return next(new ErrorResponse(400, "Invalid OTP"));

  // OTP verified → allow user to reset password
  await redis.del(`forget_password_otp:${phone}`);
  await redis.setex(`resetUserToken:${phone}`, 600, "verified"); // 10 min reset token

  res
    .status(200)
    .json(
      new SuccessResponse(200, "OTP verified, you may now reset your password.")
    );
});

// Reset password
export const resetPassword = asyncHandler(async (req, res, next) => {
  const { phone, newPassword } = req.body;

  const verified = await redis.get(`resetUserToken:${phone}`);

  if (!verified)
    return next(
      new ErrorResponse(403, "Session expired. Please reverify OTP.")
    );

  const user = await User.findOne({ phone });
  if (!user) return next(new ErrorResponse(404, "User not found"));

  user.password = newPassword;
  await user.save();

  await redis.del(`resetUserToken:${phone}`); // invalidate token
  res.status(200).json(new SuccessResponse(200, "Password reset successfully"));
});


// search vendor near me
export const searchNearMe = asyncHandler(async (req, res, next) => {
  let { latitude, longitude, radius = 10, page = 1, limit = 10 } = req.query;

  if (!latitude || !longitude) {
    return next(new ErrorResponse(400, "Latitude and Longitude are required"));
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  const radiusInMeters = parseFloat(radius) * 1000;

  const pageNumber = Math.max(1, parseInt(page));
  const limitNumber = Math.max(1, parseInt(limit));
  const skip = (pageNumber - 1) * limitNumber;

  const vendors = await Vendor.find({
    status: "active",
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
        $maxDistance: radiusInMeters,
      },
    },
  })
    // .select("-password")
    .select("vendorName profile location city state featured verifiedBadge slug")
    .skip(skip)
    .limit(limitNumber);

  const total = await Vendor.countDocuments({
    status: "active",
    location: {
      $geoWithin: {
        $centerSphere: [
          [lng, lat],
          radiusInMeters / 6378137, // meters → radians
        ],
      },
    },
  });

  const totalPages = Math.ceil(total / limitNumber);

  res.status(200).json(
    new SuccessResponse(200, "Nearby vendors fetched", {
      vendors,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages,
        radiusKm: parseFloat(radius),
      },
    })
  );
});

// search venue ear me
export const searchNearMeVenue = asyncHandler(async (req, res, next) => {
  let { latitude, longitude, radius = 10, page = 1, limit = 10 } = req.query;

  if (!latitude || !longitude) {
    return next(new ErrorResponse(400, "Latitude and Longitude are required"));
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  const radiusInMeters = parseFloat(radius) * 1000;

  const pageNumber = Math.max(1, parseInt(page));
  const limitNumber = Math.max(1, parseInt(limit));
  const skip = (pageNumber - 1) * limitNumber;

  const venue = await VenuePackage.find({
    visibility: "public" ,
    geo_loc: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
        $maxDistance: radiusInMeters,
      },
    },
  })
    // .select("-password")
    .select("title featureImage description startingPrice location")
    .skip(skip)
    .limit(limitNumber);

  const total = await VenuePackage.countDocuments({
    visibility: "public" ,
    geo_loc: {
      $geoWithin: {
        $centerSphere: [
          [lng, lat],
          radiusInMeters / 6378137, // meters → radians
        ],
      },
    },
  });

  const totalPages = Math.ceil(total / limitNumber);

  res.status(200).json(
    new SuccessResponse(200, "Nearby vendors fetched", {
      venue,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages,
        radiusKm: parseFloat(radius),
      },
    })
  );
});


export const savePlanner = asyncHandler(async (req, res) => {

  const user = await User.findById(req.user.id)

  if (!user)
      throw new Error("User not found")

  const planner = req.body.planner

  user.planners.push(planner)

  await user.save()

  res.status(201).json({
      success: true,
      planner
  })
});

export const searchVenues = async (req, res) => {
  try {
    let {
      city,
      minPrice,
      maxPrice,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    page = Math.max(1, Number(page) || 1);
    limit = Math.max(1, Math.min(50, Number(limit) || 10));

    if (city) city = city.toLowerCase().trim();
    if (search) search = search.trim();

    const filter = {
      approved: true,
      visibility: "public",
    };

    if (city) {
      filter["location.city"] = {
        $regex: `^${city}$`,
        $options: "i",
      };
    }

    if (minPrice || maxPrice) {
      filter.startingPrice = {};
      if (minPrice) filter.startingPrice.$gte = Number(minPrice);
      if (maxPrice) filter.startingPrice.$lte = Number(maxPrice);
    }

    if (search && search.length > 2) {
      filter.title = {
        $regex: search,
        $options: "i",
      };
    }
    const [venues, total] = await Promise.all([
      VenuePackage.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({
          isPremium: -1,
          inquiryCount: -1,
          createdAt: -1,
        })
        .select(
          "title slug startingPrice location.city featuredImage inquiryCount isPremium"
        ),

      VenuePackage.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      count: venues.length,
      data: venues,
    });
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


export const createContact = async (req, res) => {
  try {
    const userId = req.user._id;
    const email = req.body.email;

     if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const contact = await Contact.findOneAndUpdate(
      { user: userId },
      { user: userId, email },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "User registered in contact list",
      data: contact,
    });
  } catch (err) {
    console.error("Contact Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getPremiumVenuePackages = async (req, res) => {
  try {
    const { page = 1, limit = 10, city } = req.query;

    const filter = {
      isPremium: true,
      isActive: true,
    };

    if (city) {
      filter["location.city"] = city.toLowerCase();
    }

    const data = await VenuePackage.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await VenuePackage.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPremiumServicePackages = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, city } = req.query;

    const filter = {
      isPremium: true,
      isActive: true,
    };

    if (category) {
      filter.category = category;
    }

    if (city) {
      filter["location.city"] = city.toLowerCase();
    }

    const data = await ServicePackage.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await ServicePackage.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};