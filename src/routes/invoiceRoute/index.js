import invoiceController from "../../controller/invoiceController/index.js";

const invoiceRoute = (app) => {
  app.post('/create-invoice', invoiceController.createInvoice);
  app.get('/print-invoice/:id', invoiceController.printInvoice); // ← uses the same file now
  app.get('/get-invoice-data',invoiceController.getAllInvoicesdata)
  app.get('/get-invoice-data/:id',invoiceController.getinvoiceData)
};

export default invoiceRoute;
