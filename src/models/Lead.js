import mongoose, { Schema, model } from "mongoose";

const leadSchema = new Schema(
  {
    // Customer Details
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      city: String,
      state: String,
      fullAddress: String, // Added full address
    },
    eventDate: Date,
    guestCount: Number,
    budget: Number,
    message: String,

    // Lead Source
    source: {
      type: String,
      enum: ["website", "social", "manual"],
      default: "website",
    },
    
    // If inquiry came from a specific package
    interestedInPackage: {
      type: Schema.Types.ObjectId,
      refPath: "packageType", // Dynamic reference
    },
    packageType: {
      type: String,
      enum: ["VenuePackage", "ServicePackage"],
    },

    businessCategory: {
      type: String,
      default: "General Inquiry",
    },

    // ----------------------
    // LEAD CLASSIFICATION
    // ----------------------
    category: {
      type: String,
      default: "Standard",
    },

    price: {
      type: Number,
      required: true,
      default: 50, // Base price
    },

    deviceType: {
      type: String,
      enum: ["Mobile", "Desktop", "Tablet", "Unknown"],
      default: "Unknown",
    },

    tags: [String], // e.g., "High Budget", "Urgent", "iOS"
    status: {
      type: String,
      enum: ["active", "stopped"],
      default: "active",
      index: true, // important for filtering
    },

    expiresAt: {
      type: Date,
      default: null, // null = never expires
      index: true,
    },
    // Sales Tracking
    purchasedBy: [
      {
        vendor: {
          type: Schema.Types.ObjectId,
          ref: "Vendor",
        },
        purchasedAt: {
          type: Date,
          default: Date.now,
        },
        pricePaid: Number,
        method: {
          type: String,
          enum: ["wallet", "credit"], // Wallet Balance or Lead Credit
        },
        meta: Schema.Types.Mixed, // For storing credit costs, etc.
      },
    ],
    vendorInteractions: [
      {
        vendor: {
          type: Schema.Types.ObjectId,
          ref: "Vendor",
          required: true,
        },
        stage: {
          type: String,
          enum: ["new", "contacted", "quoted", "won", "lost"],
          default: "new",
        },
        priority: {
          type: String,
          enum: ["low", "medium", "high"],
          default: "medium",
        },
        notes: [
          {
            text: { type: String, required: true },
            createdAt: { type: Date, default: Date.now },
          },
        ],
        followUps: [
          {
            title: { type: String, required: true },
            dueAt: { type: Date, required: true },
            done: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now },
          },
        ],
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Lead = mongoose.models.Lead || model("Lead", leadSchema);
export default Lead;