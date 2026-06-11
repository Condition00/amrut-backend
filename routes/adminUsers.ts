import { Router, type Response } from "express";
import { User } from "../models/User.ts";
import { authMiddleware, type AuthRequest } from "../middleware/authMiddleware.ts";
import { superAdminMiddleware } from "../middleware/superAdminMiddleware.ts";
import { hashPassword } from "../utils/passwordHelper.ts";

const router = Router();

// Apply super-admin middleware to all endpoints in this file
router.use(authMiddleware);
router.use(superAdminMiddleware);

// GET: List all sub-admins
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const admins = await User.find({ role: "admin" })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sub-admins." });
  }
});

// POST: Create a new sub-admin
router.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email, and password are required." });
      return;
    }

    const emailLower = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      res.status(400).json({ error: "A user with this email already exists." });
      return;
    }

    const newAdmin = new User({
      name: name.trim(),
      email: emailLower,
      role: "admin",
      password: hashPassword(password),
      cart: [],
      wishlist: [],
    });

    await newAdmin.save();

    const responseData = newAdmin.toObject();
    delete responseData.password;

    res.status(201).json(responseData);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to create sub-admin." });
  }
});

// PUT: Update an existing sub-admin
router.put("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    const admin = await User.findById(req.params.id);

    if (!admin || admin.role !== "admin") {
      res.status(404).json({ error: "Sub-admin not found." });
      return;
    }

    if (email) {
      const emailLower = email.toLowerCase().trim();
      if (emailLower !== admin.email) {
        const existingUser = await User.findOne({ email: emailLower });
        if (existingUser) {
          res.status(400).json({ error: "A user with this email already exists." });
          return;
        }
        admin.email = emailLower;
      }
    }

    if (name) admin.name = name.trim();
    if (password && password.trim()) admin.password = hashPassword(password);

    await admin.save();

    const responseData = admin.toObject();
    delete responseData.password;

    res.json(responseData);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update sub-admin." });
  }
});

// DELETE: Remove a sub-admin
router.delete("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin || admin.role !== "admin") {
      res.status(404).json({ error: "Sub-admin not found." });
      return;
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Sub-admin deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete sub-admin." });
  }
});

export default router;
