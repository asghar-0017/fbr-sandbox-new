import mongoose from "mongoose";

const buyerSchemaDefinition = new mongoose.Schema({
    buyerNTNCNIC: {
        type: String,
    },
    buyerBusinessName: {
        type: String
    },
    buyerProvince: {
        type: String,
        required: true,
        unique: true,
    },
    buyerAddress: {
        type: String,
        required: true,
    },

}, {
    timestamps: true,
});

const buyerSchema = mongoose.model("buyer", buyerSchemaDefinition);
export default buyerSchema;
