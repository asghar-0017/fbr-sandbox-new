import mongoose from "mongoose";

const invoiceResponseSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true },
  dated: { type: String, required: true },
  invoiceType: { type: String },
  invoiceDate: { type: String },
  sellerNTNCNIC: { type: String },
  sellerBusinessName: { type: String },
  sellerProvince: { type: String },
  sellerAddress: { type: String },
  buyerNTNCNIC: { type: String },
  buyerBusinessName: { type: String },
  buyerProvince: { type: String },
  buyerAddress: { type: String },
  buyerRegistrationType: { type: String },
  invoiceRefNo: { type: String },
  scenarioId: { type: String },
  items: [
    {
      hsCode: { type: String },
      productDescription: { type: String },
      rate: { type: String },
      uoM: { type: String },
      quantity: { type: Number },
      unitPrice: { type: Number },
      totalValues: { type: Number },
      valueSalesExcludingST: { type: Number },
      fixedNotifiedValueOrRetailPrice: { type: Number },
      salesTaxApplicable: { type: Number },
      salesTaxWithheldAtSource: { type: Number },
      extraTax: { type: String },
      furtherTax: { type: Number },
      sroScheduleNo: { type: String },
      fedPayable: { type: Number },
      discount: { type: Number },
      saleType: { type: String },
      sroItemSerialNo: { type: String },
    },
  ],
}, { timestamps: true });

const Invoice = mongoose.models.invoice || mongoose.model("invoice", invoiceResponseSchema);
export default Invoice;
