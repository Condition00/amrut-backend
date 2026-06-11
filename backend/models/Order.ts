import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem {
  productSlug: string;
  productName: string;
  sizeWeight: string;
  price: number;
  quantity: number;
}

export interface IShippingDetails {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  items: IOrderItem[];
  amount: number;
  discount: number;
  couponApplied?: string;
  shippingDetails: IShippingDetails;
  paymentMethod: "razorpay" | "cod";
  status: "pending" | "paid" | "failed" | "cod-pending" | "delivered" | "cancelled";
  createdAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productSlug: { type: String, required: true },
  productName: { type: String, required: true },
  sizeWeight: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
});

const ShippingDetailsSchema = new Schema<IShippingDetails>({
  name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  phone: { type: String, required: true },
});

const OrderSchema = new Schema<IOrder>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  razorpayOrderId: { type: String, required: true, unique: true, index: true },
  razorpayPaymentId: { type: String },
  items: [OrderItemSchema],
  amount: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  couponApplied: { type: String },
  shippingDetails: { type: ShippingDetailsSchema, required: true },
  paymentMethod: {
    type: String,
    enum: ["razorpay", "cod"],
    default: "razorpay",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "paid", "failed", "cod-pending", "delivered", "cancelled"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

export const Order = mongoose.model<IOrder>("Order", OrderSchema);
