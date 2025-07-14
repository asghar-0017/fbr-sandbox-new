import mongoose from "mongoose";
import { type } from "os";

const adminSchemaDefinition = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  verifyToken: {
    type: String,
    default: '',
  },

  isVerify: {
    type: Boolean,
    default: false,
  },
  verifyCode: {
    type: String,
    default: '',
  },
  photoProfile: {
    type: String,
    default: ''
  },
  sandBoxTestToken:{
    type: String,
    default : "63f756ee-69e4-3b5b-a3b7-0b8656624912"
  },
  sandBoxPublishToken:{
    type: String,
    default : ""
  },
  role: {
    type: String,
    default: "admin",
  },
  sessions: [{
    token: {
      type: String,
      required: true
    }
  }]

}, {
  timestamps: true,
});

const adminSchema = mongoose.model("admin", adminSchemaDefinition);
export default adminSchema;
