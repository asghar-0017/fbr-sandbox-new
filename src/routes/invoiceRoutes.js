import express from 'express';
import * as invoiceController from '../controller/mysql/invoiceController.js';
import { identifyTenant } from '../middleWare/tenantMiddleware.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All invoice routes require authentication and tenant identification
router.use(authenticateToken);
router.use(identifyTenant);

// Invoice management routes
router.post('/invoices', invoiceController.createInvoice);
router.get('/invoices', invoiceController.getAllInvoices);
router.get('/invoices/:id', invoiceController.getInvoiceById);
router.get('/invoices/:id/print', invoiceController.printInvoice);
router.get('/invoices/number/:invoiceNumber', invoiceController.getInvoiceByNumber);
router.put('/invoices/:id', invoiceController.updateInvoice);
router.delete('/invoices/:id', invoiceController.deleteInvoice);
router.get('/invoices/stats/summary', invoiceController.getInvoiceStats);

export default router; 