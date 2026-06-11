import { Router, type Response } from "express";
import { Coupon } from "../models/Coupon.ts";
import { authMiddleware, type AuthRequest } from "../middleware/authMiddleware.ts";

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/coupons  — public (used for admin list + checkout validation)
// ---------------------------------------------------------------------------
router.get("/", async (req, res): Promise<void> => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch coupons." });
  }
});

// ---------------------------------------------------------------------------
// POST /api/coupons/validate  — public
// ---------------------------------------------------------------------------
router.post("/validate", async (req, res): Promise<void> => {
  try {
    const { code, cartValue } = req.body;
    if (!code || cartValue === undefined) {
      res.status(400).json({ error: "Coupon code and cart value are required." });
      return;
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
      isActive: true,
    });

    if (!coupon) {
      res.status(400).json({ error: "Invalid or inactive coupon code." });
      return;
    }

    if (cartValue < coupon.minCartValue) {
      res.status(400).json({
        error: `Minimum cart value of ₹${coupon.minCartValue} required for this coupon.`,
      });
      return;
    }

    let discount = 0;
    if (coupon.discountType === "fixed") {
      discount = coupon.discountValue;
    } else if (coupon.discountType === "percentage") {
      discount = parseFloat(((cartValue * coupon.discountValue) / 100).toFixed(2));
    }

    if (discount > cartValue) discount = cartValue;

    res.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: discount,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to validate coupon." });
  }
});

// ---------------------------------------------------------------------------
// POST /api/coupons  — auth required (adminMiddleware disabled for dev)
// ---------------------------------------------------------------------------
router.post("/", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code, discountType, discountValue, minCartValue, isActive } = req.body;

    if (!code || !discountType || discountValue === undefined) {
      res.status(400).json({ error: "Missing required fields." });
      return;
    }

    const existing = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      res.status(400).json({ error: "Coupon code already exists." });
      return;
    }

    const coupon = new Coupon({
      code: code.toUpperCase().trim(),
      discountType,
      discountValue,
      minCartValue: minCartValue || 0,
      isActive: isActive !== undefined ? !!isActive : true,
    });

    await coupon.save();
    res.status(201).json(coupon);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to create coupon." });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/coupons/:id  — auth required
// ---------------------------------------------------------------------------
router.put("/:id", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code, discountType, discountValue, minCartValue, isActive } = req.body;

    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      res.status(404).json({ error: "Coupon not found." });
      return;
    }

    if (code) {
      const existing = await Coupon.findOne({
        code: code.toUpperCase().trim(),
        _id: { $ne: coupon._id },
      });
      if (existing) {
        res.status(400).json({ error: "Coupon code already exists." });
        return;
      }
      coupon.code = code.toUpperCase().trim();
    }

    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (minCartValue !== undefined) coupon.minCartValue = minCartValue;
    if (isActive !== undefined) coupon.isActive = !!isActive;

    await coupon.save();
    res.json(coupon);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update coupon." });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/coupons/:id  — auth required
// ---------------------------------------------------------------------------
router.delete("/:id", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      res.status(404).json({ error: "Coupon not found." });
      return;
    }
    res.json({ message: "Coupon deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete coupon." });
  }
});

export default router;
