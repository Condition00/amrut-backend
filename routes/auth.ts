import { Router, type Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.ts";
import { authMiddleware, type AuthRequest } from "../middleware/authMiddleware.ts";
import { verifyPassword } from "../utils/passwordHelper.ts";

const router = Router();

function normalizeAvatarUrl(rawAvatar?: string): string {
  if (!rawAvatar) return "";

  const avatar = rawAvatar.trim();
  if (!avatar) return "";

  if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
    return avatar;
  }

  if (avatar.startsWith("//")) {
    return `https:${avatar}`;
  }

  // Google sometimes provides host/path-like values without protocol.
  if (avatar.startsWith("lh3.googleusercontent.com") || avatar.startsWith("googleusercontent.com")) {
    return `https://${avatar}`;
  }

  return avatar;
}

// Google Sign-in Verification (Frontend-only: backend just decodes the credential)
router.post("/google", async (req, res): Promise<void> => {
  try {
    const { credential } = req.body;
    if (!credential) {
      res.status(400).json({ error: "Google credential is required." });
      return;
    }

    // Decode the Google ID token (no verification library call needed in frontend-only)
    let payload: any;
    try {
      payload = jwt.decode(credential);
    } catch (err: any) {
      console.error("Google token decoding failed:", err.message);
      res.status(401).json({ error: "Google token decoding failed. Please sign in again." });
      return;
    }

    if (!payload || !payload.email || !payload.name) {
      res.status(400).json({ error: "Invalid Google token payload." });
      return;
    }

    const email = payload.email.toLowerCase();
    const name = payload.name;
    const avatar = normalizeAvatarUrl(payload.picture || "");
    const googleId = payload.sub;

    // Determine role by checking email against ADMIN_EMAILS or existing DB role
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase());

    // Find or create user
    let user = await User.findOne({ email });
    
    // Check if they are configured as an admin in .env (if role isn't already super-admin or admin)
    const isSystemAdmin = adminEmails.includes(email);
    let role = user?.role || (isSystemAdmin ? "admin" : "user");

    if (!user) {
      user = new User({
        email,
        name,
        avatar,
        googleId,
        role,
        cart: [],
        wishlist: [],
      });
      await user.save();
    } else {
      // Sync Google attributes
      user.name = name;
      if (avatar) {
        user.avatar = avatar;
      }
      // If user became system admin, promote them unless they're already super-admin
      if (isSystemAdmin && user.role !== "super-admin") {
        user.role = "admin";
      }
      await user.save();
    }

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET || "supersecretkey-andra-amruth-2026";
    const token = jwt.sign(
      { id: user._id, email: user.email },
      jwtSecret,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        cart: user.cart,
        wishlist: user.wishlist,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ error: "Internal server error during authentication." });
  }
});

// Admin Email & Password Login Route
router.post("/admin/login", async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    const emailLower = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailLower });
    
    if (!user) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    // Verify role is admin or super-admin
    if (user.role !== "admin" && user.role !== "super-admin") {
      res.status(403).json({ error: "Access denied. Admin role required." });
      return;
    }

    // Verify hashed password
    if (!user.password || !verifyPassword(password, user.password)) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET || "supersecretkey-andra-amruth-2026";
    const token = jwt.sign(
      { id: user._id, email: user.email },
      jwtSecret,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        cart: user.cart,
        wishlist: user.wishlist,
      },
    });
  } catch (error) {
    console.error("Admin credentials login error:", error);
    res.status(500).json({ error: "Internal server error during authentication." });
  }
});

// Get User Profile & Sync
router.get("/profile", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(404).json({ error: "User profile not found." });
      return;
    }

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      cart: user.cart,
      wishlist: user.wishlist,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error fetching profile." });
  }
});

export default router;
