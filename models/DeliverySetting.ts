import mongoose, { Schema, type Document } from "mongoose";

export interface IDeliverySetting extends Document {
  key: string;
  deliveryCharge: number;
  freeDeliveryThreshold: number;
  updatedAt: Date;
}

const DeliverySettingSchema = new Schema<IDeliverySetting>(
  {
    key: { type: String, default: "default", unique: true, index: true },
    deliveryCharge: { type: Number, default: 60 },
    freeDeliveryThreshold: { type: Number, default: 500 },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const DeliverySetting = mongoose.model<IDeliverySetting>("DeliverySetting", DeliverySettingSchema);