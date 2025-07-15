import { Console } from "console";
import userModel from "../../model/registerUser/index.js";
import findUserByEmail from "../../utils/findUserByEmail/index.js";
import bcrypt from "bcryptjs";

const registerUserController = {

    registerUser: async (req, res) => {
        try {
            const data = req.body;
            const existingUserResult = await findUserByEmail(data.email);
            console.log("existingUserResult", existingUserResult);

            if (existingUserResult.user) {
                return res.status(400).json({ message: "User already exists with this email" });
            }
            const hashPassword = await bcrypt.hash(data.password,10)
            data.password=hashPassword

            const newUser = await userModel.create(data);
            return res.status(201).json({ message: "User registered successfully", user: newUser });
        } catch (error) {
            return res.status(500).json({ message: "Server Error", error: error.message });
        }
    },


    getAllUsers: async (req, res) => {
        try {
            const users = await userModel.find();
            return res.status(200).json({ users });
        } catch (error) {
            return res.status(500).json({ message: "Server Error", error: error.message });
        }
    },

    getUserById: async (req, res) => {
        try {
            const user = await userModel.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            return res.status(200).json({ user });
        } catch (error) {
            return res.status(500).json({ message: "Server Error", error: error.message });
        }
    },

    updateUser: async (req, res) => {
        try {
            const data=req.body
            if(data.password){
                const hashPassword= await bcrypt.hash(data.password,10)
                data.password=hashPassword
            }
            const updatedUser = await userModel.findByIdAndUpdate(req.params.id, data, { new: true });
            if (!updatedUser) {
                return res.status(404).json({ message: "User not found" });
            }
            return res.status(200).json({ message: "User updated successfully", user: updatedUser });
        } catch (error) {
            return res.status(500).json({ message: "Server Error", error: error.message });
        }
    },

    deleteUser: async (req, res) => {
        try {
            const deletedUser = await userModel.findByIdAndDelete(req.params.id);
            if (!deletedUser) {
                return res.status(404).json({ message: "User not found" });
            }
            return res.status(200).json({ message: "User deleted successfully" });
        } catch (error) {
            return res.status(500).json({ message: "Server Error", error: error.message });
        }
    }

};

export default registerUserController;
