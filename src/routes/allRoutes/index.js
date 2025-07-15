import invoiceRoute from "../invoiceRoute/index.js";
import authenticationRoute from "../authenticationRoute/index.js";
import registerUserRoute from "../registerUserRoute/index.js"

const allRoutes = (app)=>{
    invoiceRoute(app)
    authenticationRoute(app)
    registerUserRoute(app)
}
export default allRoutes