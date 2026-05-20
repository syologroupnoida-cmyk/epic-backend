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
import sendEmail from "../utils/sendEmail.js";
import {
  isDevMode,
  otpCacheGet,
  otpCacheSet,
  otpCacheDel,
  verifyOtpCode,
} from "../utils/otpCache.js";
import Vendor from "../models/Vendor.js";
import VenuePackage from "../models/VenuePackage.js";
import ServicePackage from "../models/ServicePackage.js";
import Contact from "../models/contact.js";
import RealStory from "../models/realStory.js";
import SearchLog from "../models/searchlog.js";
import UserInterest from "../models/UserInterest.js";

// @desc    Send Registration OTP to Email
// @route   POST /api/v1/user/send-register-otp
// @access  Public
export const sendRegisterOTP = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorResponse(400, "Please provide an email address"));
  }

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return next(new ErrorResponse(400, "User already exists with this email"));
  }

  // Check if OTP was already sent recently (optional but good practice)
  const existingOtp = await otpCacheGet(`register_otp:${email}`);
  if (existingOtp) {
    // Allow resend — overwrite below
  }

  const otp = generateOtp();

  await otpCacheSet(`register_otp:${email}`, otp, 600);

  let emailSent = false;
  try {
    emailSent = await sendEmail(
      email,
      "Registration OTP",
      `Your OTP for registration is <b>${otp}</b>. It is valid for 10 minutes.`
    );
  } catch (err) {
    console.error("Registration email error:", err.message);
  }

  if (!emailSent && !isDevMode()) {
    return next(new ErrorResponse(500, "Failed to send OTP email"));
  }

  const payload = isDevMode() ? { devOtp: otp } : {};
  res
    .status(200)
    .json(new SuccessResponse(200, "OTP sent to your email", payload));
});

// @desc    Register a new user (Verify OTP and Create Profile)
// @route   POST /api/v1/user/register
// @access  Public
export const registerUser = asyncHandler(async (req, res, next) => {
  const { fullName, email, password, phone, otp } = req.body;

  if (!fullName || !email || !password || !otp) {
    return next(new ErrorResponse(400, "Please provide all required fields including OTP"));
  }

  const otpValid = await verifyOtpCode(`register_otp:${email}`, otp);
  if (!otpValid) {
    return next(new ErrorResponse(400, "Invalid OTP"));
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

  // Delete OTP after successful registration
  await otpCacheDel(`register_otp:${email}`);

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
    let activeBool = isActive;
    if (isActive === "true" || isActive === true) activeBool = true;
    else if (isActive === "false" || isActive === false) activeBool = false;
    else {
      return next(new ErrorResponse(400, "isActive must be true or false"));
    }
    user.isActive = activeBool;
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

// @desc    Get Google Auth URL
// @route   GET /api/v1/user/google-auth-url
// @access  Public
export const getGoogleAuthUrl = asyncHandler(async (req, res, next) => {
  const { redirect_uri } = req.query;

  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    redirect_uri: redirect_uri || "postmessage",
  });

  return res.status(200).json(
    new SuccessResponse(200, "Google Auth URL generated successfully", { authUrl })
  );
});

// @desc    Google Login/Signup
// @route   POST /api/v1/user/google-auth
// @access  Public
export const googleAuth = asyncHandler(async (req, res, next) => {
  const { code, idToken, credential, redirect_uri } = req.body;

  if (!code && !idToken && !credential) {
    return next(new ErrorResponse(400, "Google authorization code or token missing"));
  }

  try {
    let finalIdToken = idToken || credential;

    if (code) {
      // Exchange code for tokens (support dynamic redirect_uri if provided)
      const { tokens } = await client.getToken({
        code,
        redirect_uri: redirect_uri || "postmessage",
      });
      finalIdToken = tokens.id_token;
    }

    if (!finalIdToken) {
      return next(new ErrorResponse(400, "Could not retrieve ID token from Google"));
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: finalIdToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const googleData = {
      googleId: payload.sub,
      fullName: payload.name,
      email: payload.email,
      profilePic: payload.picture,
    };

    // Check if user exists by email
    let user = await User.findOne({ email: googleData.email });

    if (user) {
      // If user exists but doesn't have googleId (was registered via email/password), link it
      if (!user.googleId) {
        user.googleId = googleData.googleId;
        // Skip validation to avoid password required error on existing docs if any schema issue
        await user.save({ validateBeforeSave: false });
      }
    } else {
      // New user -> Create account
      user = await User.create({
        fullName: googleData.fullName,
        email: googleData.email,
        googleId: googleData.googleId,
        profile: {
          public_id: "google_profile",
          url: googleData.profilePic,
        },
      });
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
        },
        accessToken,
        refreshToken,
      })
    );
  } catch (error) {
    console.error("Google Auth Error:", error?.response?.data || error.message);
    return next(
      new ErrorResponse(
        400,
        error?.response?.data?.error_description ||
          error.message ||
          "Google authentication failed"
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
    visibility: "public",
    approved: true,
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
    .populate("venueCategory", "name slug")
    .select(
      "title slug featuredImage description startingPrice location venueCategory isPremium isPopular"
    )
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


export const createRealStory = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const {
    serviceType,
    vendor,
    title,
    story,
    experience,
    rating,
    location,
    coupleName,
  } = req.body;

  if (!serviceType || !title || !story || !experience || !rating) {
    return res.status(400).json({
      success: false,
      message: "Required fields missing",
    });
  }

  const newStory = await RealStory.create({
    user: userId,
    serviceType,
    vendor,
    title,
    story,
    experience,
    rating,
    location,
    coupleName,
    images: req.files || [], // if using multer/cloudinary
  });

  res.status(201).json({
    success: true,
    message: "Story submitted successfully",
    data: newStory,
  });
});
export const getRealStories = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    serviceType,
    featured,
  } = req.query;

  const filter = {};

  // Normalize
  const normalizedServiceType = serviceType?.trim();

  if (normalizedServiceType) {
    filter.serviceType = {
      $regex: `^${normalizedServiceType}$`,
      $options: "i",
    };
  }

  if (featured === "true") {
    filter.isFeatured = true;
  }
  console.log("Real Stories Filter:", filter);
  const stories = await RealStory.find(filter)
    .populate("vendor", "businessName")
    .populate("user", "name")
    .sort({ isFeatured: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await RealStory.countDocuments(filter);

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    data: stories,
  });
});

export const getSingleStory = asyncHandler(async (req, res) => {
  const story = await RealStory.findById(req.params.id)
    .populate("vendor", "businessName")
    .populate("user", "name");

  if (!story) {
    return res.status(404).json({
      success: false,
      message: "Story not found",
    });
  }

  res.status(200).json({
    success: true,
    data: story,
  });
});

export const getPopularSearches = async (req, res) => {
  try {
    const { limit = 10, city, type } = req.query;

    const match = {};

    // 🌍 Filter by city
    if (city) {
      match.city = city.toLowerCase().trim();
    }

    // 📂 Filter by category type (venue/service/product)
    if (type) {
      match.categoryType = type;
    }

    // ⏱️ Last 7 days data
    match.createdAt = {
      $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    };

    const data = await SearchLog.aggregate([
      { $match: match },

      // 🧠 Group by normalized query
      {
        $group: {
          _id: "$normalizedQuery",
          count: { $sum: 1 },
          lastSearched: { $max: "$createdAt" },
        },
      },

      // ⚡ Trending score (recent + frequent)
      {
        $addFields: {
          score: {
            $divide: [
              "$count",
              {
                $add: [
                  {
                    $divide: [
                      { $subtract: [new Date(), "$lastSearched"] },
                      1000 * 60 * 60, // hours
                    ],
                  },
                  1,
                ],
              },
            ],
          },
        },
      },

      { $sort: { score: -1 } },
      { $limit: Number(limit) },

      // 🎯 Clean response
      {
        $project: {
          _id: 0,
          title: "$_id",
          count: 1,
          score: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    console.error("Popular Search Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
//    STORE USER INTEREST (Wishlist, Purchase, Inquiry, View)
// ======================================================
export const storeUserInterest = asyncHandler(async (req, res, next) => {
  const { vendorId, venueId, typeOfInterest } = req.body;

  if (!vendorId && !venueId) {
    return next(new ErrorResponse(400, "Please provide a vendorId or venueId"));
  }

  if (!typeOfInterest || !["purchase", "wishlist", "inquiry", "view"].includes(typeOfInterest)) {
    return next(
      new ErrorResponse(
        400,
        "Please provide a valid typeOfInterest: purchase, wishlist, inquiry, or view"
      )
    );
  }

  // Verify that the vendor/venue actually exists
  if (vendorId) {
    const vendorExists = await Vendor.findById(vendorId);
    if (!vendorExists) {
      return next(new ErrorResponse(444, "Vendor not found"));
    }
  }

  if (venueId) {
    const venueExists = await VenuePackage.findById(venueId);
    if (!venueExists) {
      return next(new ErrorResponse(444, "Venue package not found"));
    }
  }

  // Create or update (upsert) the interest to prevent duplicate wishlist/purchase entries
  const interest = await UserInterest.findOneAndUpdate(
    {
      user: req.user._id,
      vendor: vendorId || null,
      venue: venueId || null,
      typeOfInterest,
    },
    {
      user: req.user._id,
      vendor: vendorId || undefined,
      venue: venueId || undefined,
      typeOfInterest,
    },
    { new: true, upsert: true }
  );

  return res.status(200).json(
    new SuccessResponse(200, "User interest saved successfully", {
      interest,
    })
  );
});

// ======================================================
//    GET USER INTERESTS
// ======================================================
export const getUserInterests = asyncHandler(async (req, res, next) => {
  const { type } = req.query;

  const query = { user: req.user._id };
  if (type) {
    if (!["purchase", "wishlist", "inquiry", "view"].includes(type)) {
      return next(new ErrorResponse(400, "Invalid typeOfInterest filter"));
    }
    query.typeOfInterest = type;
  }

  const interests = await UserInterest.find(query)
    .populate("vendor", "_id vendorName email phone featured status verifiedBadge logo")
    .populate("venue", "_id title slug startingPrice location featuredImage");

  return res.status(200).json(
    new SuccessResponse(200, "User interests retrieved successfully", {
      count: interests.length,
      interests,
    })
  );
});

// ======================================================
//    REMOVE USER INTEREST
// ======================================================
export const removeUserInterest = asyncHandler(async (req, res, next) => {
  const { vendorId, venueId, typeOfInterest } = req.body;

  if (!vendorId && !venueId) {
    return next(new ErrorResponse(400, "Please provide a vendorId or venueId"));
  }

  const query = { user: req.user._id };
  if (vendorId) query.vendor = vendorId;
  if (venueId) query.venue = venueId;
  if (typeOfInterest) {
    query.typeOfInterest = typeOfInterest;
  }

  const result = await UserInterest.deleteMany(query);

  if (result.deletedCount === 0) {
    return next(new ErrorResponse(404, "No matching interest found to delete"));
  }

  return res.status(200).json(
    new SuccessResponse(200, "User interest(s) removed successfully", {
      deletedCount: result.deletedCount,
    })
  );
});