import crypto from "crypto";
import Vendor from "../../../models/Vendor.js";
import redis from "../../../config/redisClient.js";
import { generateOtp } from "../../../utils/helper.js";
import { sendOtpSms } from "../../../utils/smsService.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../../utils/generateToken.js";
import ErrorResponse from "../../../utils/ErrorResponse.js";

const DEFAULT_PROFILE = {
  url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80",
  public_id: "vendor/default-profile",
};

const DEFAULT_COORDINATES = [77.209, 28.6139]; // Delhi NCR

const PHONE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

const OTP_TTL_SECONDS = 300;
const DEV_OTP = process.env.OTP_DEV_CODE || "1234";

const isDev = () =>
  process.env.NODE_ENV !== "production" ||
  process.env.OTP_DEV_MODE === "true";

/** In-memory fallback when Redis is unavailable */
const memoryOtpStore = new Map();

export const validatePhone = (phone) => PHONE_REGEX.test(String(phone || ""));

export const validateEmail = (email) => EMAIL_REGEX.test(String(email || ""));

const formatVendorResponse = (vendor) => {
  const vendorObj = vendor.toObject ? vendor.toObject() : vendor;
  delete vendorObj.password;
  delete vendorObj.refreshToken;

  return {
    id: vendorObj._id,
    brandName: vendorObj.vendorName,
    city: vendorObj.city,
    vendorType: vendorObj.category,
    email: vendorObj.email,
    mobile: vendorObj.phone,
    role: vendorObj.role,
    status: vendorObj.status,
    kycStatus: vendorObj.kycStatus || "not_started",
    createdAt: vendorObj.createdAt,
    profile: vendorObj.profile,
  };
};

const issueTokens = async (vendor) => {
  const accessToken = generateAccessToken(vendor._id);
  const refreshToken = generateRefreshToken(vendor._id);
  vendor.refreshToken = refreshToken;
  await vendor.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

const cacheGet = async (key) => {
  try {
    const value = await redis.get(key);
    if (value) return value;
  } catch (err) {
    console.error("Redis GET error:", err.message);
  }

  const entry = memoryOtpStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    memoryOtpStore.delete(key);
    return null;
  }
  return entry.otp;
};

const cacheSet = async (key, otp) => {
  const expires = Date.now() + OTP_TTL_SECONDS * 1000;
  memoryOtpStore.set(key, { otp, expires });

  try {
    await redis.setex(key, OTP_TTL_SECONDS, otp);
  } catch (err) {
    console.error("Redis SET error (using memory fallback):", err.message);
  }
};

const cacheDel = async (key) => {
  memoryOtpStore.delete(key);
  try {
    await redis.del(key);
  } catch (err) {
    console.error("Redis DEL error:", err.message);
  }
};

const verifyStoredOtp = async (key, otp) => {
  if (isDev() && String(otp) === DEV_OTP) {
    await cacheDel(key);
    return;
  }

  const storedOtp = await cacheGet(key);
  if (!storedOtp) {
    throw new ErrorResponse(400, "OTP expired or not found");
  }
  if (storedOtp !== String(otp)) {
    throw new ErrorResponse(400, "Invalid OTP");
  }
  await cacheDel(key);
};

const buildOtpResult = (message, otp) => {
  const result = { message };
  if (isDev()) {
    result.devOtp = otp;
    console.log(`[DEV OTP] ${message} → ${otp}`);
  }
  return result;
};

export const sendRegisterOtp = async (mobile) => {
  if (!validatePhone(mobile)) {
    throw new ErrorResponse(400, "Invalid mobile number");
  }

  const otpKey = `vendor_register_otp:${mobile}`;
  if (await cacheGet(otpKey)) {
    throw new ErrorResponse(400, "OTP already sent. Please wait.");
  }

  const phoneExists = await Vendor.exists({ phone: mobile });
  if (phoneExists) {
    throw new ErrorResponse(
      400,
      "A vendor with this mobile number already exists"
    );
  }

  const otp = generateOtp();
  await cacheSet(otpKey, otp);

  try {
    await sendOtpSms(mobile, otp, "vendor registration");
  } catch (err) {
    console.error("Vendor register OTP SMS error:", err.message);
  }

  return buildOtpResult("OTP sent successfully", otp);
};

export const registerVendor = async ({
  brandName,
  city,
  vendorType,
  email,
  mobile,
  otp,
}) => {
  if (!brandName?.trim()) throw new ErrorResponse(400, "Brand name is required");
  if (!city?.trim()) throw new ErrorResponse(400, "City is required");
  if (!vendorType?.trim()) throw new ErrorResponse(400, "Vendor type is required");
  if (!validateEmail(email)) throw new ErrorResponse(400, "Invalid email address");
  if (!validatePhone(mobile)) throw new ErrorResponse(400, "Invalid mobile number");
  if (!otp) throw new ErrorResponse(400, "OTP is required");

  await verifyStoredOtp(`vendor_register_otp:${mobile}`, otp);

  const emailExists = await Vendor.exists({ email: email.toLowerCase() });
  if (emailExists) {
    throw new ErrorResponse(400, "A vendor with this email already exists");
  }

  const phoneExists = await Vendor.exists({ phone: mobile });
  if (phoneExists) {
    throw new ErrorResponse(
      400,
      "A vendor with this mobile number already exists"
    );
  }

  const randomPassword = crypto.randomBytes(16).toString("hex");

  const vendor = await Vendor.create({
    vendorName: brandName.trim(),
    category: vendorType.trim(),
    city: city.trim(),
    state: city.trim(),
    locality: city.trim(),
    address: `${city.trim()}, India`,
    contactPerson: brandName.trim(),
    phone: mobile,
    email: email.toLowerCase().trim(),
    password: randomPassword,
    experience: 1,
    workingSince: new Date().getFullYear(),
    profile: DEFAULT_PROFILE,
    location: {
      type: "Point",
      coordinates: DEFAULT_COORDINATES,
    },
    role: "vendor",
    status: "pending",
  });

  const { accessToken, refreshToken } = await issueTokens(vendor);

  return {
    vendor: formatVendorResponse(vendor),
    accessToken,
    refreshToken,
  };
};

export const sendLoginOtp = async (mobile) => {
  if (!validatePhone(mobile)) {
    throw new ErrorResponse(400, "Invalid mobile number");
  }

  const vendor = await Vendor.findOne({ phone: mobile });
  if (!vendor) {
    throw new ErrorResponse(
      404,
      "No vendor account found with this mobile number"
    );
  }

  if (vendor.status === "blocked") {
    throw new ErrorResponse(
      403,
      "Your account has been blocked. Please contact support."
    );
  }

  const otpKey = `vendor_login_otp:${mobile}`;
  const existingOtp = await cacheGet(otpKey);
  if (existingOtp) {
    try {
      await sendOtpSms(mobile, existingOtp, "vendor login");
    } catch (err) {
      console.error("Vendor login OTP resend SMS error:", err.message);
    }
    return buildOtpResult("OTP already sent. Please use the existing OTP.", existingOtp);
  }

  const otp = generateOtp();
  await cacheSet(otpKey, otp);

  try {
    await sendOtpSms(mobile, otp, "vendor login");
  } catch (err) {
    console.error("Vendor login OTP SMS error:", err.message);
  }

  return buildOtpResult("OTP sent successfully", otp);
};

export const verifyLoginOtp = async ({ mobile, otp }) => {
  if (!validatePhone(mobile)) {
    throw new ErrorResponse(400, "Invalid mobile number");
  }
  if (!otp) throw new ErrorResponse(400, "OTP is required");

  await verifyStoredOtp(`vendor_login_otp:${mobile}`, otp);

  const vendor = await Vendor.findOne({ phone: mobile });
  if (!vendor) {
    throw new ErrorResponse(404, "Vendor not found");
  }

  if (vendor.status === "blocked") {
    throw new ErrorResponse(
      403,
      "Your account has been blocked. Please contact support."
    );
  }

  const { accessToken, refreshToken } = await issueTokens(vendor);

  return {
    vendor: formatVendorResponse(vendor),
    accessToken,
    refreshToken,
  };
};

export const refreshVendorToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new ErrorResponse(400, "Refresh token is required");
  }

  const jwt = (await import("jsonwebtoken")).default;
  let decoded;

  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new ErrorResponse(401, "Invalid or expired refresh token");
  }

  if (decoded.type !== "refresh") {
    throw new ErrorResponse(401, "Invalid token type");
  }

  const vendor = await Vendor.findById(decoded.id).select("+refreshToken");
  if (!vendor || vendor.refreshToken !== refreshToken) {
    throw new ErrorResponse(401, "Invalid refresh token");
  }

  const accessToken = generateAccessToken(vendor._id);
  return { accessToken, vendor: formatVendorResponse(vendor) };
};
