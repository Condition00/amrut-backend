import { Router, type Response } from "express";
import { authMiddleware, type AuthRequest } from "../middleware/authMiddleware.ts";
import { User } from "../models/User.ts";

const router = Router();

// Sync/Update Cart
router.put("/cart", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const { cart } = req.body; // Array of { productSlug, sizeWeight, quantity }
    if (!Array.isArray(cart)) {
      res.status(400).json({ error: "Cart must be an array of items." });
      return;
    }

    // Validate structure of cart items
    for (const item of cart) {
      if (!item.productSlug || !item.sizeWeight || typeof item.quantity !== "number") {
        res.status(400).json({ error: "Invalid cart item structure." });
        return;
      }
    }

    user.cart = cart;
    await user.save();

    res.json({ message: "Cart synced successfully.", cart: user.cart });
  } catch (error) {
    res.status(500).json({ error: "Failed to sync cart." });
  }
});

// Sync/Update Wishlist
router.put("/wishlist", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const { wishlist } = req.body; // Array of productSlugs (strings)
    if (!Array.isArray(wishlist)) {
      res.status(400).json({ error: "Wishlist must be an array of product slugs." });
      return;
    }

    user.wishlist = wishlist;
    await user.save();

    res.json({ message: "Wishlist synced successfully.", wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ error: "Failed to sync wishlist." });
  }
});

export default router;
