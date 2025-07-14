import invoiceRoute from "../invoiceRoute/index.js";
import authenticationRoute from "../authenticationRoute/index.js";

const allRoutes = (app)=>{
    invoiceRoute(app)
    authenticationRoute(app)
}
export default allRoutes