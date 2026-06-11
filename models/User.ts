import mongoose, { Schema, Document } from "mongoose";

export interface ICartItem {
  productSlug: string;
  sizeWeight: string;
  quantity: number;
}

export interface IUser extends Document {
  email: string;
  name: string;
  googleId?: string;
  avatar?: string;
  role: "user" | "admin" | "super-admin";
  password?: string;
  cart: ICartItem[];
  wishlist: string[];
  createdAt: Date;
}

const CartItemSchema = new Schema<ICartItem>({
  productSlug: { type: String, required: true },
  sizeWeight: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
});

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  googleId: { type: String },
  avatar: { type: String },
  role: { type: String, enum: ["user", "admin", "super-admin"], default: "user" },
  password: { type: String },
  cart: [CartItemSchema],
  wishlist: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model<IUser>("User", UserSchema);
