import { Router, type Response } from "express";
import { LabReport } from "../models/LabReport.ts";
import { authMiddleware, type AuthRequest } from "../middleware/authMiddleware.ts";
import { adminMiddleware } from "../middleware/adminMiddleware.ts";

const router = Router();

// Get all lab reports
router.get("/", async (req, res): Promise<void> => {
  try {
    const reports = await LabReport.find({}).sort({ uploadedAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch lab reports." });
  }
});

// Admin ONLY: Add new lab report
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { title, productSlug, pdfUrl } = req.body;

      if (!title || !productSlug || !pdfUrl) {
        res.status(400).json({ error: "Missing required fields (title, productSlug, pdfUrl)." });
        return;
      }

      const report = new LabReport({
        title,
        productSlug,
        pdfUrl,
      });

      await report.save();
      res.status(201).json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to create lab report." });
    }
  }
);

// Admin ONLY: Edit lab report
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { title, productSlug, pdfUrl } = req.body;

      const report = await LabReport.findById(req.params.id);
      if (!report) {
        res.status(404).json({ error: "Lab report not found." });
        return;
      }

      if (title) report.title = title;
      if (productSlug) report.productSlug = productSlug;
      if (pdfUrl) report.pdfUrl = pdfUrl;

      await report.save();
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to update lab report." });
    }
  }
);

// Admin ONLY: Delete lab report
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const report = await LabReport.findByIdAndDelete(req.params.id);
      if (!report) {
        res.status(404).json({ error: "Lab report not found." });
        return;
      }
      res.json({ message: "Lab report deleted successfully." });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete lab report." });
    }
  }
);

export default router;
