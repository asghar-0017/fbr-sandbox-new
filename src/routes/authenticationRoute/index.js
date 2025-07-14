import authentication from '../../controller/adminAuthController/index.js';

const authenticationRoute = (app) => {
  app.post('/login', authentication.login);
  app.post('/forget-password', authentication.forgotPassword);
  app.post('/verify-reset-code', authentication.verifyResetCode);
  app.put('/reset-password', authentication.resetPassword);
  app.get('/logout', authentication.logout);
  app.get('/verify-token', authentication.verifyToken);
};

export default authenticationRoute
