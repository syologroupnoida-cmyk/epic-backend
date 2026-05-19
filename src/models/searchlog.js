// models/SearchLog.js

import mongoose, { Schema, model } from "mongoose";

const searchLogSchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: true,
      trim: true,
    },

    normalizedQuery: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    categoryType: {
      type: String,
      enum: ["venue", "service", "product"],
      required: true,
      index: true,
    },

    city: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    //  IMPORTANT (anti-spam + analytics)
    sessionId: {
      type: String,
      index: true,
    },

    // optional filters (future use)
    filters: {
      type: Object,
      default: {},
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

//  Indexes for fast aggregation
searchLogSchema.index({ normalizedQuery: 1, createdAt: -1 });
searchLogSchema.index({ city: 1, createdAt: -1 });
searchLogSchema.index({ categoryType: 1, createdAt: -1 });

export default mongoose.models.SearchLog || mongoose.model("SearchLog", searchLogSchema);