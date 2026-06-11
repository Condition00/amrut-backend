import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Initialize environment variables immediately
dotenv.config();

import { seedDatabase } from "./seed.ts";

// Routes
import authRoutes from "./routes/auth.ts";
import productRoutes from "./routes/products.ts";
import couponRoutes from "./routes/coupons.ts";
import userRoutes from "./routes/user.ts";
import orderRoutes from "./routes/orders.ts";
import adminUserRoutes from "./routes/adminUsers.ts";
import uploadRoutes from "./routes/upload.ts";

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/andra-amruth";

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      (process.env.FRONTEND_URL || "http://localhost:8080").toLowerCase().trim(),
      "http://localhost:8080",
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
    ];

    const normalizedOrigin = origin.toLowerCase().trim().replace(/\/$/, "");

    const isAllowed = allowedOrigins.some(o => {
      const normalizedAllowed = o.replace(/\/$/, "");
      return normalizedAllowed === normalizedOrigin;
    });

    if (
      isAllowed || 
      normalizedOrigin.startsWith("http://localhost:") || 
      normalizedOrigin.startsWith("http://127.0.0.1:")
    ) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked for origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: "10mb" })); // Increased limit for potential base64 image uploads
app.use(cookieParser());

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Database Connection
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB successfully.");
    // Run seed script
    await seedDatabase();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/user", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/upload", uploadRoutes);

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});