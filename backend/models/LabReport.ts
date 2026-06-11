import mongoose, { Schema, Document } from "mongoose";

export interface ILabReport extends Document {
  title: string;
  productSlug: string;
  pdfUrl: string;
  uploadedAt: Date;
}

const LabReportSchema = new Schema<ILabReport>({
  title: { type: String, required: true },
  productSlug: { type: String, required: true, index: true },
  pdfUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

export const LabReport = mongoose.model<ILabReport>("LabReport", LabReportSchema);
