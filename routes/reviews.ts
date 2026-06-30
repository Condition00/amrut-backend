import { Router, type Response } from "express";
import { authMiddleware, type AuthRequest } from "../middleware/authMiddleware.ts";
import { adminMiddleware } from "../middleware/adminMiddleware.ts";
import { Review } from "../models/Review.ts";
import { Order } from "../models/Order.ts";
import { Product } from "../models/Product.ts";

const router = Router();

router.get("/mine", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }

    const reviews = await Review.find({ userId: user._id }).sort({ updatedAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch your reviews." });
  }
});

router.get("/product/:slug", async (req, res): Promise<void> => {
  try {
    const reviews = await Review.find({ productSlug: req.params.slug })
      .sort({ createdAt: -1 })
      .limit(6);

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch product reviews." });
  }
});

router.get("/admin", authMiddleware, adminMiddleware, async (_req, res): Promise<void> => {
  try {
    const reviews = await Review.find({})
      .populate("userId", "name email")
      .populate("orderId", "razorpayOrderId status createdAt")
      .sort({ updatedAt: -1 });

    const products = await Product.find({ slug: { $in: reviews.map((review) => review.productSlug) } }).select("slug name category");
    const productMap = new Map(products.map((product) => [product.slug, product]));

    res.json(
      reviews.map((review) => {
        const product = productMap.get(review.productSlug);
        return {
          _id: review._id,
          productSlug: review.productSlug,
          productName: product?.name || review.productSlug,
          productCategory: product?.category || "",
          userName: review.userName,
          userId: typeof review.userId === "object" && review.userId ? review.userId : null,
          orderId: typeof review.orderId === "object" && review.orderId ? review.orderId : null,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
        };
      })
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reviews." });
  }
});

router.post("/", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }

    const { productSlug, rating, comment } = req.body;
    const normalizedRating = Number(rating);
    const normalizedComment = typeof comment === "string" ? comment.trim() : "";

    if (!productSlug || !Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      res.status(400).json({ error: "Product slug and a 1-5 star rating are required." });
      return;
    }

    if (normalizedComment.length < 3) {
      res.status(400).json({ error: "Please write a short review comment." });
      return;
    }

    const product = await Product.findOne({ slug: productSlug });
    if (!product) {
      res.status(404).json({ error: "Product not found." });
      return;
    }

    const deliveredOrder = await Order.findOne({
      userId: user._id,
      status: "delivered",
      "items.productSlug": productSlug,
    });

    if (!deliveredOrder) {
      res.status(403).json({ error: "You can only review products after a delivered purchase." });
      return;
    }

    const review = await Review.findOneAndUpdate(
      { userId: user._id, productSlug },
      {
        userId: user._id,
        userName: user.name,
        productSlug,
        orderId: deliveredOrder._id,
        rating: normalizedRating,
        comment: normalizedComment,
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(201).json(review);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to save review." });
  }
});

export default router;