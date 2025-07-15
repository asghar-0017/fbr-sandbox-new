import registerBuyerController from "../../controller/registerBuyerController/index.js";

const registerBuyerRoute = (app) => {
    app.post('/register-buyer',  registerBuyerController.registerUser);
    app.get('/get-buyers',  registerBuyerController.getAllUsers);
    app.get('/get-buyer/:id', registerBuyerController.getUserById);
    app.put('/update-buyer/:id',  registerBuyerController.updateUser);
    app.delete('/delete-buyer/:id', registerBuyerController.deleteUser);
};

export default registerBuyerRoute;
