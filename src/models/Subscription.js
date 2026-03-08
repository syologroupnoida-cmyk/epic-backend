import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: true,
    unique: true
  },

  leadCredits: {
    type: Number,
    required: true
  },

  durationDays: {
    type: Number,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  // vendors: [{
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "Vendor"
  // }],

  active: {
    type: Boolean,
    default: true
  }
},
{ timestamps: true }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;