import { Router, type Request, type Response } from "express";
import path from "path";
import fs from "fs";
import { authMiddleware, type AuthRequest } from "../middleware/authMiddleware.ts";

const router = Router();

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * POST /api/upload
 * Body: { image: "data:image/jpeg;base64,...", filename: "photo.jpg" }
 * Returns: { url: "http://..." }
 */
router.post("/", authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const { image, filename } = req.body as { image?: string; filename?: string };

    if (!image) {
      res.status(400).json({ error: "No image data provided." });
      return;
    }

    // Expect data URI: "data:image/jpeg;base64,/9j/..."
    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      res.status(400).json({ error: "Invalid image format. Expected a base64 data URI." });
      return;
    }

    const mimeType = match[1]!;
    const base64Data = match[2]!;

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(mimeType)) {
      res.status(400).json({ error: "Only JPEG, PNG, WebP, or GIF images are allowed." });
      return;
    }

    const ext = mimeType.split("/")[1]!.replace("jpeg", "jpg");
    const safeName = (filename || "image")
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-z0-9_-]/gi, "_")
      .slice(0, 40);
    const uniqueName = `${Date.now()}-${safeName}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, uniqueName);

    // Rough size check: base64 length * 0.75 ≈ bytes
    const approxBytes = base64Data.length * 0.75;
    if (approxBytes > 10 * 1024 * 1024) {
      res.status(400).json({ error: "Image too large. Max 10 MB." });
      return;
    }

    fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));

    const baseUrl =
      process.env.BACKEND_URL ||
      `http://localhost:${process.env.PORT || 3000}`;

    res.json({ url: `${baseUrl}/uploads/${uniqueName}` });
  } catch (err: any) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message || "Upload failed." });
  }
});

export default router;
