import mongoose, { model, Schema, Types } from "mongoose";
import slugify from "slugify";

const albumsSchema = new Schema(
  {
    title: String,
    thumbnail: {
      public_id: {
        type: String,
        required: [true, "Thumbnail public_id is required"],
      },
      url: {
        type: String,
        required: [true, "Thumbnail url is required"],
      },
    },
    images: [
      {
        public_id: {
          type: String,
          required: [true, "Image public_id is required"],
        },
        url: {
          type: String,
          required: [true, "Image url is required"],
        },
      },
    ],
  },
  { _id: false }
);

const videosSchema = new Schema(
  {
    title: { type: String },
    url: { type: String },
  },
  { _id: false }
);

const faqSchema = new Schema(
  {
    question: String,
    answer: String,
  },
  { _id: false }
);

const servicePackageSchema = new Schema(
  {
    vendor: {
      type: Types.ObjectId,
      ref: "Vendor",
      required: [true, "Vendor is required"],
    },
    serviceSubCategory: {
      type: Types.ObjectId,
      ref: "ServiceSubCategory",
      required: [true, "Service sub-category is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    featuredImage: {
      public_id: {
        type: String,
        required: [true, "Featured image public_id is required"],
      },
      url: {
        type: String,
        required: [true, "Featured image url is required"],
      },
    },
    description: {
      type: String,
      required: [true, "Full description is required"],
    },
    startingPrice: {
      type: Number,
      required: [true, "Starting price is required"],
    },
    // fields locality, full address, city, state, country, google maps link, pincode
    location: {
      locality: {
        type: String,
        required: [true, "Locality is required"],
      },
      fullAddress: {
        type: String,
        required: [true, "Full address is required"],
      },
      city: {
        type: String,
        required: [true, "City is required"],
      },
      state: {
        type: String,
        required: [true, "State is required"],
      },
      country: {
        type: String,
        required: [true, "Country is required"],
      },
      googleMapsLink: {
        type: String,
      },
      pincode: {
        type: String,
        required: [true, "Pincode is required"],
      },
    },
    services: [
      {
        name: { type: String },
        value: { type: Schema.Types.Mixed },
        icon: String,
        type: { type: String },
        _id: false,
      },
    ],

    photoAlbums: [albumsSchema],

    videos: [videosSchema],

    reviews: [
      {
        type: Types.ObjectId,
        ref: "Review",
      },
    ],

    faqs: [faqSchema],

    approved: {
      type: Boolean,
      default: false,
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    inquiryCount: {
      type: Number,
      default: 0,
    },
    isPremium: {
      type: Boolean,
      default: false,
      index: true,
    },
     // ⭐ Soft delete  
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

servicePackageSchema.pre("save", async function () {
  if (!this.isModified("title") && !this.isModified("location.city")) {
    return;
  }

  const baseSlug = slugify(this.title, {
    lower: true,
    strict: true,
    trim: true,
  });

  const citySlug = slugify(this.location.city || "", {
    lower: true,
    strict: true,
    trim: true,
  });

  this.slug = `${baseSlug}-${citySlug}-${this._id.toString()}`;
});

const ServicePackage =
  mongoose.models.ServicePackage ||
  model("ServicePackage", servicePackageSchema);

export default ServicePackage;
