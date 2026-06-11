import { Router, type Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { Order } from "../models/Order.ts";
import { User } from "../models/User.ts";
import { authMiddleware, type AuthRequest } from "../middleware/authMiddleware.ts";
import { adminMiddleware } from "../middleware/adminMiddleware.ts";

const router = Router();

const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "rzp_test_fakekey";
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "fakesecretkey";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

// Create Order (to get razorpayOrderId or confirm COD)
router.post("/", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }

    const { items, amount, discount, couponApplied, shippingDetails, paymentMethod = "razorpay" } = req.body;

    if (!items || !items.length || !amount || !shippingDetails) {
      res.status(400).json({ error: "Missing required checkout parameters." });
      return;
    }

    if (paymentMethod === "cod") {
      const localOrderId = `cod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const order = new Order({
        userId: user._id,
        razorpayOrderId: localOrderId,
        items,
        amount,
        discount: discount || 0,
        couponApplied,
        shippingDetails,
        paymentMethod: "cod",
        status: "cod-pending",
      });

      await order.save();

      // Clear user's cart
      user.cart = [];
      await user.save();

      res.status(201).json({
        success: true,
        message: "Order placed successfully (Cash on Delivery).",
        dbOrderId: order._id,
      });
      return;
    }

    // Create order in Razorpay
    // Amount is in rupees in request, needs to be in paise for Razorpay
    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_order_${Date.now()}_${user._id.toString().substring(0, 5)}`,
    };

    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create(options);
    } catch (err: any) {
      console.error("Razorpay API error:", err);
      res.status(500).json({ error: err.message || "Failed to initiate Razorpay order." });
      return;
    }

    // Save order in our MongoDB database as pending
    const order = new Order({
      userId: user._id,
      razorpayOrderId: razorpayOrder.id,
      items,
      amount,
      discount: discount || 0,
      couponApplied,
      shippingDetails,
      paymentMethod: "razorpay",
      status: "pending",
    });

    await order.save();

    res.status(201).json({
      keyId: razorpayKeyId,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      dbOrderId: order._id,
    });
  } catch (error: any) {
    console.error("Order creation error:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
});

// Verify Payment Signature
router.post("/verify", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ error: "Missing payment verification parameters." });
      return;
    }

    // Verify signature
    const hmac = crypto.createHmac("sha256", razorpayKeySecret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      res.status(400).json({ error: "Payment verification failed. Invalid signature." });
      return;
    }

    // Find order and update status
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) {
      res.status(404).json({ error: "Order not found." });
      return;
    }

    order.status = "paid";
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    // Clear user's cart
    const user = req.user;
    if (user) {
      user.cart = [];
      await user.save();
    }

    res.json({ success: true, message: "Payment verified successfully.", orderId: order._id });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ error: "Verification process failed." });
  }
});

// GET /api/orders/admin — Fetch all orders (admin only)
router.get("/admin", authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Fetch orders error:", error);
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

// PUT /api/orders/admin/:id/status — Update order status (admin only)
router.put("/admin/:id/status", authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: "Status is required." });
      return;
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ error: "Order not found." });
      return;
    }

    const validStatuses = ["pending", "paid", "failed", "cod-pending", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: "Invalid status." });
      return;
    }

    order.status = status as any;
    await order.save();

    res.json(order);
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ error: "Failed to update order status." });
  }
});

export default router;
