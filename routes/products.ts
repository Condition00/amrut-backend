import { Router, type Response } from "express";
import { Product } from "../models/Product.ts";
import { Review } from "../models/Review.ts";
import { authMiddleware, type AuthRequest } from "../middleware/authMiddleware.ts";

const router = Router();

type ReviewSummary = {
  ratingAverage: number;
  reviewCount: number;
};

async function getReviewSummaries(slugs: string[]): Promise<Map<string, ReviewSummary>> {
  if (!slugs.length) return new Map();

  const aggregated = await Review.aggregate([
    { $match: { productSlug: { $in: slugs } } },
    {
      $group: {
        _id: "$productSlug",
        ratingAverage: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const summaryMap = new Map<string, ReviewSummary>();
  for (const row of aggregated) {
    summaryMap.set(row._id, {
      ratingAverage: Number((row.ratingAverage || 0).toFixed(1)),
      reviewCount: row.reviewCount || 0,
    });
  }

  return summaryMap;
}

function withReviewSummary<T extends { slug: string }>(product: T, summaryMap: Map<string, ReviewSummary>) {
  const summary = summaryMap.get(product.slug);
  return {
    ...product,
    ratingAverage: summary?.ratingAverage ?? 0,
    reviewCount: summary?.reviewCount ?? 0,
  };
}

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
    if (req.query.search) {
      const searchStr = req.query.search as string;
      filter.$or = [
        { name: { $regex: searchStr, $options: "i" } },
        { tagline: { $regex: searchStr, $options: "i" } },
        { description: { $regex: searchStr, $options: "i" } },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    const reviewSummaries = await getReviewSummaries(products.map((product) => product.slug));

    res.json({
      products: products.map((product) => withReviewSummary(product.toObject(), reviewSummaries)),
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
// GET /api/products/categories  — public
// Returns all categories currently used by products so the UI can stay dynamic.
// ---------------------------------------------------------------------------
router.get("/categories", async (_req, res): Promise<void> => {
  try {
    const categories = await Product.distinct("category");
    res.json(categories.filter(Boolean).sort((a, b) => a.localeCompare(b)));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories." });
  }
});

// ---------------------------------------------------------------------------
// GET /api/products/categories  — public
// Returns all categories currently used by products so the UI can stay dynamic.
// ---------------------------------------------------------------------------
router.get("/categories", async (_req, res): Promise<void> => {
  try {
    const categories = await Product.distinct("category");
    res.json(categories.filter(Boolean).sort((a, b) => a.localeCompare(b)));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories." });
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

    const reviewSummaries = await getReviewSummaries([product.slug]);

    res.json(withReviewSummary(product.toObject(), reviewSummaries));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch product details." });
  }
});

// ---------------------------------------------------------------------------
// POST /api/products  — admin only (auth check retained, adminMiddleware disabled for dev)
// ---------------------------------------------------------------------------
router.post("/", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, tagline, description, image, category, sizes, stock, featured, isHotOffer } = req.body;

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
      stock: Number.isFinite(Number(stock)) ? Math.max(0, Number(stock)) : 15,
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
    const { name, tagline, description, image, category, sizes, stock, featured, isHotOffer } = req.body;

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
    if (stock !== undefined) product.stock = Math.max(0, Number(stock) || 0);
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
