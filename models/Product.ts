import mongoose, { Schema, Document } from "mongoose";

export interface ISize {
  weight: string;
  price: number;
}

export interface IProduct extends Document {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  category: "Veg" | "Non-Veg" | "Sun Dries" | "Powders" | "Spices";
  sizes: ISize[];
  featured: boolean;
  isHotOffer: boolean;
  createdAt: Date;
}

const SizeSchema = new Schema<ISize>({
  weight: { type: String, required: true },
  price: { type: Number, required: true },
});

const ProductSchema = new Schema<IProduct>({
  slug: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  tagline: { type: String, default: "" },
  description: { type: String, default: "" },
  image: { type: String, default: "" },
  category: {
    type: String,
    enum: ["Veg", "Non-Veg", "Sun Dries", "Powders", "Spices"],
    required: true,
  },
  sizes: [SizeSchema],
  featured: { type: Boolean, default: false },
  isHotOffer: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const Product = mongoose.model<IProduct>("Product", ProductSchema);
