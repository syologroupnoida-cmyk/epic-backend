import mongoose, { Schema } from "mongoose";

const realStorySchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Which service user used
    serviceType: {
      type: String,
      enum: ["Makeup", "Photography", "Mehndi", "Decorator", "Venue", "Other"],
      required: true,
    },

    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    story: {
      type: String,
      required: true,
    },

    experience: {
      type: String,
      enum: ["Excellent", "Good", "Average", "Poor"],
      required: true,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    // Images (like wedding photos)
    images: [
      {
        public_id: String,
        url: String,
      },
    ],

    location: {
      type: String, // e.g. Goa Beach, Jaipur Palace
    },

    coupleName: {
      type: String, // "Shefali + Nitish"
    },

    isFeatured: {
      type: Boolean,
      default: false, // for homepage highlights
    },

    // isApproved: {
    //   type: Boolean,
    //   default: false, // admin moderation
    // },
  },
  { timestamps: true }
);

export default mongoose.model("RealStory", realStorySchema);