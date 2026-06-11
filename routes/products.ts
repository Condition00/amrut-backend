import { Router, type Response } from "express";
import { Product } from "../models/Product.ts";
import { authMiddleware, type AuthRequest } from "../middleware/authMiddleware.ts";

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/products  — public, paginated
// Query params: page (default 1), limit (default 12), category, featured, isHotOffer
// ---------------------------------------------------------------------------
router.get("/", async (req, res): Promise<void> => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || "12", 10)));
    const skip = (page - 1) * limit;

    // Build filter
    const filter: Record<string, any> = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.featured === "true") filter.featured = true;
    if (req.query.isHotOffer === "true") filter.isHotOffer = true;

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products." });
  }
});

// ---------------------------------------------------------------------------
// GET /api/products/:slug  — public
// ---------------------------------------------------------------------------
router.get("/:slug", async (req, res): Promise<void> => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) {
      res.status(404).json({ error: "Product not found." });
      return;
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch product details." });
  }
});

// ---------------------------------------------------------------------------
// POST /api/products  — admin only (auth check retained, adminMiddleware disabled for dev)
// ---------------------------------------------------------------------------
router.post("/", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, tagline, description, image, category, sizes, featured, isHotOffer } = req.body;

    if (!name || !image || !category || !sizes || !sizes.length) {
      res.status(400).json({ error: "Missing required fields." });
      return;
    }

    // Generate unique slug
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    let slugExists = await Product.findOne({ slug });
    let counter = 1;
    const baseSlug = slug;
    while (slugExists) {
      slug = `${baseSlug}-${counter}`;
      slugExists = await Product.findOne({ slug });
      counter++;
    }

    const product = new Product({
      slug,
      name,
      tagline,
      description,
      image,
      category,
      sizes,
      featured: !!featured,
      isHotOffer: !!isHotOffer,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error: any) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: error.message || "Failed to create product." });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/products/:slug  — admin only
// ---------------------------------------------------------------------------
router.put("/:slug", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, tagline, description, image, category, sizes, featured, isHotOffer } = req.body;

    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) {
      res.status(404).json({ error: "Product not found." });
      return;
    }

    if (name) product.name = name;
    if (tagline !== undefined) product.tagline = tagline;
    if (description !== undefined) product.description = description;
    if (image) product.image = image;
    if (category) product.category = category;
    if (sizes) product.sizes = sizes;
    if (featured !== undefined) product.featured = !!featured;
    if (isHotOffer !== undefined) product.isHotOffer = !!isHotOffer;

    await product.save();
    res.json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update product." });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/products/:slug  — admin only
// ---------------------------------------------------------------------------
router.delete("/:slug", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.findOneAndDelete({ slug: req.params.slug });
    if (!product) {
      res.status(404).json({ error: "Product not found." });
      return;
    }
    res.json({ message: "Product deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete product." });
  }
});

export default router;
