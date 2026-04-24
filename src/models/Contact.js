import mongoose, { Schema, Types } from "mongoose";

const contactSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// optional: prevent duplicate entries per user
contactSchema.index({ user: 1 }, { unique: true });

export default mongoose.model("Contact", contactSchema);