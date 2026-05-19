import mongoose, { Schema, model } from "mongoose";

const userInterestSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      required: false,
    },
    venue: {
      type: Schema.Types.ObjectId,
      ref: "VenuePackage",
      required: false,
    },
    typeOfInterest: {
      type: String,
      enum: ["purchase", "wishlist", "inquiry", "view"],
      required: [true, "Type of interest is required"],
    },
  },
  { timestamps: true }
);

// Performance optimizations for rapid querying by user, vendor, venue, and interest type
userInterestSchema.index({ user: 1, typeOfInterest: 1 });
userInterestSchema.index({ vendor: 1 });
userInterestSchema.index({ venue: 1 });
userInterestSchema.index({ user: 1, vendor: 1, venue: 1, typeOfInterest: 1 }, { unique: true });

const UserInterest =
  mongoose.models.UserInterest || model("UserInterest", userInterestSchema);

export default UserInterest;
