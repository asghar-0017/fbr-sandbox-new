import authenticationService from '../../service/AdminAuthService/index.js';
import generateResetCode from '../../mediater/generateResetCode/index.js';
import sendResetEmail from '../../mediater/sendReserEmail/index.js';
import dotenv from 'dotenv';
dotenv.config();
const authentication = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const authResult = await authenticationService.login({ email, password });
      if (!authResult || !authResult.user) {
        return res.status(401).send({ message: 'Invalid Username or Password' });
      }
      const { token, user } = authResult;
      return res.status(200).send({ data: { token, user } });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
  },

  logout: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).send({ message: 'No token provided' });
      }
      const token = authHeader.split(' ')[1];
      const result = await authenticationService.logout(token);
      if (result) {
        res.status(200).send({ message: 'Logged out successfully' });
      } else {
        res.status(401).send({ message: 'Invalid token or already logged out' });
      }
    } catch (error) {
      res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
  },

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const code = generateResetCode();
      const result = await authenticationService.saveResetCode(code, email);

      if (result) {
        const data = await sendResetEmail(email, code);
        res.status(200).send({ message: 'Password reset code sent.' });
      } else {
        res.status(400).send({ message: 'Invalid Email Address' });
      }
    } catch (error) {
      res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
  },

  verifyResetCode: async (req, res) => {
    try {
      const { code } = req.body;
      const isCodeValid = await authenticationService.validateResetCode(code);
      if (isCodeValid) {
        res.status(200).send({ message: 'Code verified successfully.' });

      } else {
        res.status(400).send({ message: 'Invalid or expired code.' });
      }
    } catch (error) {
      res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { email, newPassword } = req.body;
      if (!newPassword || !email) {
        return res.status(400).send({ message: 'Missing password or email' });
      }
      const data = await authenticationService.updatePassword(newPassword, email);
      if (data) {
        res.status(200).send({ message: 'Password reset successfully.' });
      }
      else {
        res.status(404).send({ message: "Not Found" })
      }
    } catch (error) {
      res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
  },
  
  verifyToken: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).send({ code: 401, message: 'No token provided' });
      }
      const token = authHeader.split(' ')[1];
      const isValid = await authenticationService.verifyToken(token);

      if (isValid) {
        res.status(200).send({ code: 200, isValid: true });
      } else {
        res.status(401).send({ code: 401, message: 'Invalid token or role' });
      }
    } catch (error) {
      console.error('Error in verifyToken controller:', error.message);
      res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
  },

};

export default authentication;
