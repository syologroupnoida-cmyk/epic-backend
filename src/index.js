import dotenv from "@dotenvx/dotenvx";
import { v2 as cloudinary } from "cloudinary";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import connectDB from "./db/index.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";
import adminRoutes from "./routes/admin.js";
import locationRoutes from "./routes/location.js";
import vendorRoutes from "./routes/vendor.js";
import vendorAuthRoutes from "./modules/vendor/routes/vendorAuthRoutes.js";
import vendorKycRoutes from "./modules/vendor/routes/vendorKycRoutes.js";
import transactionRoutes from "./routes/transaction.js";
import leadRoutes from "./routes/lead.js";
import publicRoutes from "./routes/public.js";
import otpRoutes from "./routes/otp.js";
import blogRoutes from "./routes/blog.js";
import userRoutes from "./routes/user.js";
import produtRoutes from "./routes/product.js";
import { startLeadAssignmentCron } from "./jobs/leadAssignmentCron.js";

import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const app = express();
const port = process.env.PORT || 3000;
const node_env = process.env.NODE_ENV || "development";

dotenv.config({
  path: node_env === "production" ? ".env" : ".env.local",
});

connectDB();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(
  express.json({
    limit: "10mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  }),
);

app.use(
  cookieParser({
    limit: "16kb",
  }),
);

const allowedOrigins = [
  process.env.SITE_URL,
  process.env.ADMIN_URL,
  "https://wedplanners.in",
  "https://www.wedplanners.in",
  "https://epic-site-1.vercel.app",
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }),
);

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Swagger Setup
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Epic Backend API",
      version: "1.0.1",
      description: "API Documentation",
    },
    servers: [
      {
        url: "/api/v1",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use("/api/v1/vendor", vendorRoutes);
app.use("/api/v1/vendor/auth", vendorAuthRoutes);
app.use("/api/v1/vendor/kyc", vendorKycRoutes);
app.use("/api/v1/location", locationRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/transaction", transactionRoutes);
app.use("/api/v1/leads", leadRoutes); // Vendor Lead Management
app.use("/api/v1/public", publicRoutes); // Website Public APIs
app.use("/api/v1/otp", otpRoutes);
app.use("/api/v1/blogs", blogRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/products", produtRoutes);

// Error Middleware
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Server is running on port ${port} in ${node_env} Mode`);
  startLeadAssignmentCron();
});
