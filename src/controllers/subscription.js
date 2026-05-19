import asyncHandler from "../utils/asyncHandler.js";
import Vendor from "../models/Vendor.js";
import Subscription from "../models/Subscription.js";
import ErrorResponse from "../utils/ErrorResponse.js";
import SuccessResponse from "../utils/SuccessResponse.js";


export const createSubscription = asyncHandler(async (req, res, next) => {

  const { name, leadCredits, durationDays, price } = req.body;

  if (!name || !leadCredits || !durationDays || !price) {
    return next(new ErrorResponse(400, "All fields are required"));
  }

  const existingPlan = await Subscription.findOne({ name });

  if (existingPlan) {
    return next(new ErrorResponse(400, "Subscription with this name already exists"));
  }
  if (leadCredits <= 0)
    return next(new ErrorResponse(400, "Lead credits must be greater than 0"));

  if (durationDays <= 0)
    return next(new ErrorResponse(400, "Duration must be greater than 0"));

  if (price < 0)
    return next(new ErrorResponse(400, "Price cannot be negative"));

  const subscription = await Subscription.create({
    name,
    leadCredits,
    durationDays,
    price
  });

  res.status(201).json({
    success: true,
    message: "Subscription created successfully",
    subscription
  });
});

export const buySubscription = asyncHandler(async (req, res, next) => {

  const { subscriptionId } = req.body;

  const vendor = await Vendor.findById(req.vendor._id);
  if (!vendor) return next(new ErrorResponse(404, "Vendor not found"));

  const plan = await Subscription.findById(subscriptionId);
  if (!plan) return next(new ErrorResponse(404, "Subscription plan not found"));

  if (!plan.active)
    return next(new ErrorResponse(400, "Subscription not available"));

  const now = new Date();

  if (
    vendor.subscription &&
    vendor.subscription.expiresAt &&
    vendor.subscription.expiresAt > now
  ) {
    return next(new ErrorResponse(400, "Subscription already active"));
  }

  const purchasedAt = new Date();

  const expiresAt = new Date(
    purchasedAt.getTime() + plan.durationDays * 24 * 60 * 60 * 1000
  );

  vendor.subscription = {
    plan: plan._id,
    leadCredits: plan.leadCredits,
    purchasedAt,
    expiresAt
  };

  await vendor.save();

  res.status(200).json({
    success: true,
    message: "Subscription activated",
    subscription: vendor.subscription
  });
});

export const toggleSubscriptionStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const subscription = await Subscription.findById(id);

  if (!subscription)
    return next(new ErrorResponse(404, "Subscription not found"));

  subscription.active = !subscription.active;

  await subscription.save();

  res.status(200).json(
    new SuccessResponse(200, "Subscription status updated", {
      id: subscription._id,
      active: subscription.active
    })
  );
});

export const updateSubscription = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const { name, leadCredits, durationDays, price } = req.body;

  const subscription = await Subscription.findById(id);

  if (!subscription)
    return next(new ErrorResponse(404, "Subscription not found"));

  if (name !== undefined) subscription.name = name;
  if (leadCredits !== undefined) subscription.leadCredits = leadCredits;
  if (durationDays !== undefined) subscription.durationDays = durationDays;
  if (price !== undefined) subscription.price = price;

  await subscription.save();

  res.status(200).json(
    new SuccessResponse(200, "Subscription updated successfully", subscription)
  );
});

export const getSubscriptions = asyncHandler(async (req, res) => {

  const subscriptions = await Subscription.find().sort({ createdAt: -1 });

  res
    .status(200)
    .json(new SuccessResponse(200, "Subscriptions fetched", subscriptions));
});


export const deleteSubscription = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const subscription = await Subscription.findById(id);

  if (!subscription) {
    return next(new ErrorResponse(404, "Subscription not found"));
  }

  await Subscription.findByIdAndDelete(id);

  res.status(200).json(
    new SuccessResponse(200, "Subscription deleted successfully")
  );
});