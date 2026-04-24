import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },

    comment: {
      type: String,
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
      index: true,
    },

    category: {
      type: String,
      trim: true,
      index: true,
    },

    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },

    reviews: [reviewSchema],

    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: (val) => Math.round(val * 10) / 10, // 4.333 → 4.3
    },

    numReviews: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

productSchema.methods.hasUserReviewed = function (userId) {
  return this.reviews.some(
    (rev) => rev.user.toString() === userId.toString()
  );
};

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;