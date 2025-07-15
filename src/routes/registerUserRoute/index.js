import combinedAuthenticate from "../../middleWare/combineAuthenticate/index.js";
import checkRole from "../../middleWare/checkRole/index.js";
import registerUserController from "../../controller/registerUserController/index.js";

const registerUserRoute = (app) => {
    app.post('/register-users', combinedAuthenticate, checkRole(['admin']), registerUserController.registerUser);
    app.get('/get-users', combinedAuthenticate, checkRole(['admin','user']), registerUserController.getAllUsers);
    app.get('/get-user/:id', combinedAuthenticate, checkRole(['admin','user']), registerUserController.getUserById);
    app.put('/update-user/:id', combinedAuthenticate, checkRole(['admin','user']), registerUserController.updateUser);
    app.delete('/delete-user/:id', combinedAuthenticate, checkRole(['admin']), registerUserController.deleteUser);
};

export default registerUserRoute;
