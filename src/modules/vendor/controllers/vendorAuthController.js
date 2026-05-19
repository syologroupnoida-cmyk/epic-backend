import asyncHandler from "../../../utils/asyncHandler.js";
import SuccessResponse from "../../../utils/SuccessResponse.js";
import {
  sendRegisterOtp,
  registerVendor,
  sendLoginOtp,
  verifyLoginOtp,
  refreshVendorToken,
} from "../services/vendorAuthService.js";

export const sendVendorRegisterOtp = asyncHandler(async (req, res) => {
  const { mobile } = req.body;
  const result = await sendRegisterOtp(mobile);
  res
    .status(200)
    .json(
      new SuccessResponse(200, result.message, result.devOtp ? { devOtp: result.devOtp } : {})
    );
});

export const vendorRegister = asyncHandler(async (req, res) => {
  const { brandName, city, vendorType, email, mobile, otp } = req.body;
  const result = await registerVendor({
    brandName,
    city,
    vendorType,
    email,
    mobile,
    otp,
  });

  res.status(201).json(
    new SuccessResponse(201, "Vendor registered successfully", result)
  );
});

export const sendVendorLoginOtp = asyncHandler(async (req, res) => {
  const { mobile } = req.body;
  const result = await sendLoginOtp(mobile);
  res
    .status(200)
    .json(
      new SuccessResponse(200, result.message, result.devOtp ? { devOtp: result.devOtp } : {})
    );
});

export const vendorOtpLogin = asyncHandler(async (req, res) => {
  const { mobile, otp } = req.body;
  const result = await verifyLoginOtp({ mobile, otp });

  res.status(200).json(
    new SuccessResponse(200, "Login successful", result)
  );
});

export const vendorAuthRefresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await refreshVendorToken(refreshToken);

  res.status(200).json(
    new SuccessResponse(200, "Token refreshed", result)
  );
});
