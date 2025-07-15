import mongoose from "mongoose";
import { type } from "os";

const UserSchemaDefinition = new mongoose.Schema({
    firstName: {
        type: String,
    },
    lastName: {
        type: String
    },
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
    sandBoxTestToken: {
        type: String,
    },
    sandBoxPublishToken: {
        type: String,
        default: ""
    },
    role: {
        type: String,
        default: "user",
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

const userSchema = mongoose.model("users", UserSchemaDefinition);
export default userSchema;
