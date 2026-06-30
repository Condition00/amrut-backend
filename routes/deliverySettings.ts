import { Router, type Response } from "express";
import { DeliverySetting } from "../models/DeliverySetting.ts";
import { authMiddleware, type AuthRequest } from "../middleware/authMiddleware.ts";
import { adminMiddleware } from "../middleware/adminMiddleware.ts";

const router = Router();

async function getOrCreateDeliverySettings() {
  let settings = await DeliverySetting.findOne({ key: "default" });
  if (!settings) {
    settings = await DeliverySetting.create({ key: "default" });
  }
  return settings;
}

router.get("/", async (_req, res): Promise<void> => {
  try {
    const settings = await getOrCreateDeliverySettings();
    res.json({
      deliveryCharge: settings.deliveryCharge,
      freeDeliveryThreshold: settings.freeDeliveryThreshold,
      updatedAt: settings.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch delivery settings." });
  }
});

router.put("/", authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deliveryCharge, freeDeliveryThreshold } = req.body;

    if (deliveryCharge === undefined || freeDeliveryThreshold === undefined) {
      res.status(400).json({ error: "Delivery charge and free delivery threshold are required." });
      return;
    }

    const settings = await getOrCreateDeliverySettings();
    settings.deliveryCharge = Number(deliveryCharge);
    settings.freeDeliveryThreshold = Number(freeDeliveryThreshold);
    await settings.save();

    res.json({
      deliveryCharge: settings.deliveryCharge,
      freeDeliveryThreshold: settings.freeDeliveryThreshold,
      updatedAt: settings.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update delivery settings." });
  }
});

export default router;