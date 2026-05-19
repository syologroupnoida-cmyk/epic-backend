import mongoose from "mongoose";
import dns from "dns";  // ← Add this
import Admin from "../models/Admin.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
const connectDB = async () => {
  try {

    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${process.env.DB_NAME}?retryWrites=true&w=majority&authSource=admin`
    );
    console.log(
      `\nMongoDB Connected || DB NAME: ${process.env.DB_NAME} || DB HOST: ${connectionInstance.connection.host}`
    );

    // Auto-seed default superadmin
    try {
      const adminCount = await Admin.countDocuments();
      if (adminCount === 0) {
        await Admin.create({
          fullName: "Default Admin",
          email: "admin@epic.com",
          password: "adminpassword",
          type: "superadmin",
          role: "admin",
          isActive: true,
        });
        console.log("Default Super Admin seeded: admin@epic.com / adminpassword");
      }
    } catch (seedErr) {
      console.error("Failed to seed default admin:", seedErr.message);
    }

  } catch (error) {
    console.log("MongoDB Connection FAILED:", error);
  }
};

export default connectDB;
