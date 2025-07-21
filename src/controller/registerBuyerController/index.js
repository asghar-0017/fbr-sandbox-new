import buyerModel from "../../model/registerUser/index.js";
import findUserByEmail from "../../utils/findUserByEmail/index.js";
import bcrypt from "bcryptjs";

const registerBuyerController = {

registerUser: async (req, res) => {
  try {
    const data = req.body;

    if (data.buyerNTNCNIC === '0000000000000') {
      const newUser = await buyerModel.create(data);
      return res.status(201).json({ message: "User registered successfully", user: newUser });
    }

    const existingUsers = await buyerModel.find({ buyerNTNCNIC: data.buyerNTNCNIC });

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "User already exists with this NTN/CNIC" });
    }
    const newUser = await buyerModel.create(data);
    return res.status(201).json({ message: "User registered successfully", user: newUser });

  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
},


    getAllUsers: async (req, res) => {
        try {
            const users = await buyerModel.find();
            return res.status(200).json({ users });
        } catch (error) {
            return res.status(500).json({ message: "Server Error", error: error.message });
        }
    },

    getUserById: async (req, res) => {
        try {
            const user = await buyerModel.findById(req.params.id);
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
            const updatedUser = await buyerModel.findByIdAndUpdate(req.params.id, data, { new: true });
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
            const deletedUser = await buyerModel.findByIdAndDelete(req.params.id);
            if (!deletedUser) {
                return res.status(404).json({ message: "User not found" });
            }
            return res.status(200).json({ message: "User deleted successfully" });
        } catch (error) {
            return res.status(500).json({ message: "Server Error", error: error.message });
        }
    }

};

export default registerBuyerController;
