import mongoose, { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";

export const ADMIN_TYPES = ["superadmin", "finance", "support", "editor"];

const adminSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      default: "admin",
    },
    type: {
      type: String,
      enum: ADMIN_TYPES,
      default: "superadmin",
      lowercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    refreshToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

adminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

adminSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const Admin = mongoose.models.Admin || model("Admin", adminSchema);

export default Admin;
