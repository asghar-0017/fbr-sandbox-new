import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import ejs from 'ejs';
import puppeteer from 'puppeteer';
import numberToWords from 'number-to-words';
import TenantDatabaseService from '../../service/TenantDatabaseService.js';
const { toWords } = numberToWords;

export const createInvoice = async (req, res) => {
  try {
    const { Invoice, InvoiceItem } = req.tenantModels;
    const { 
      invoice_number, invoiceType, invoiceDate,
      sellerNTNCNIC, sellerBusinessName, sellerProvince, sellerAddress,
      buyerNTNCNIC, buyerBusinessName, buyerProvince, buyerAddress, buyerRegistrationType,
      invoiceRefNo, scenario_id, items, status = 'draft', fbr_invoice_number = null
    } = req.body;

    // Debug: Log the received items data
    console.log('Received items data:', JSON.stringify(items, null, 2));

    // Validate required fields
    if (!invoice_number) {
      return res.status(400).json({
        success: false,
        message: 'Invoice number and date are required'
      });
    }

    // Check if invoice number already exists
    const existingInvoice = await Invoice.findOne({
      where: { invoice_number }
    });

    if (existingInvoice) {
      return res.status(409).json({
        success: false,
        message: 'Invoice with this number already exists'
      });
    }

    // Create invoice with transaction
    const result = await req.tenantDb.transaction(async (t) => {
      // Create invoice
      const invoice = await Invoice.create({
        invoice_number,
        invoiceType,
        invoiceDate,
        sellerNTNCNIC,
        sellerBusinessName,
        sellerProvince,
        sellerAddress,
        buyerNTNCNIC,
        buyerBusinessName,
        buyerProvince,
        buyerAddress,
        buyerRegistrationType,
        invoiceRefNo,
        scenario_id,
        status,
        fbr_invoice_number
      }, { transaction: t });

      // Create invoice items if provided
      if (items && Array.isArray(items) && items.length > 0) {
        const invoiceItems = items.map(item => {
          // Helper function to convert empty strings to null
          const cleanValue = (value) => {
            if (value === "" || value === "N/A" || value === null || value === undefined) {
              return null;
            }
            return value;
          };

          // Helper function to convert numeric strings to numbers
          const cleanNumericValue = (value) => {
            const cleaned = cleanValue(value);
            if (cleaned === null) return null;
            const num = parseFloat(cleaned);
            return isNaN(num) ? null : num;
          };

          const mappedItem = {
            invoice_id: invoice.id,
            hsCode: cleanValue(item.hsCode),
            productDescription: cleanValue(item.productDescription),
            rate: cleanValue(item.rate),
            uoM: cleanValue(item.uoM),
            quantity: cleanNumericValue(item.quantity),
            unitPrice: cleanNumericValue(item.unitPrice),
            totalValues: cleanNumericValue(item.totalValues),
            valueSalesExcludingST: cleanNumericValue(item.valueSalesExcludingST),
            fixedNotifiedValueOrRetailPrice: cleanNumericValue(item.fixedNotifiedValueOrRetailPrice),
            salesTaxApplicable: cleanNumericValue(item.salesTaxApplicable),
            salesTaxWithheldAtSource: cleanNumericValue(item.salesTaxWithheldAtSource),
            extraTax: cleanValue(item.extraTax),
            furtherTax: cleanNumericValue(item.furtherTax),
            sroScheduleNo: cleanValue(item.sroScheduleNo),
            fedPayable: cleanNumericValue(item.fedPayable),
            discount: cleanNumericValue(item.discount),
            saleType: cleanValue(item.saleType),
            sroItemSerialNo: cleanValue(item.sroItemSerialNo),
            billOfLadingUoM: cleanValue(item.billOfLadingUoM)
          };
          
          // Debug: Log the mapped item
          console.log('Mapped invoice item:', JSON.stringify(mappedItem, null, 2));
          
          return mappedItem;
        });

        console.log('About to create invoice items:', JSON.stringify(invoiceItems, null, 2));
        await InvoiceItem.bulkCreate(invoiceItems, { transaction: t });
      }

      return invoice;
    });

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: {
        invoice_id: result.id,
        invoice_number: result.invoice_number,
        status: result.status
      }
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating invoice',
      error: error.message
    });
  }
};

// Save invoice as draft
export const saveInvoice = async (req, res) => {
  try {
    const { Invoice, InvoiceItem } = req.tenantModels;
    const { 
      invoiceType, invoiceDate,
      sellerNTNCNIC, sellerBusinessName, sellerProvince, sellerAddress,
      buyerNTNCNIC, buyerBusinessName, buyerProvince, buyerAddress, buyerRegistrationType,
      invoiceRefNo, scenario_id, items 
    } = req.body;

    // Generate a temporary invoice number for draft
    const tempInvoiceNumber = `DRAFT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create invoice with draft status
    const result = await req.tenantDb.transaction(async (t) => {
      const invoice = await Invoice.create({
        invoice_number: tempInvoiceNumber,
        invoiceType,
        invoiceDate,
        sellerNTNCNIC,
        sellerBusinessName,
        sellerProvince,
        sellerAddress,
        buyerNTNCNIC,
        buyerBusinessName,
        buyerProvince,
        buyerAddress,
        buyerRegistrationType,
        invoiceRefNo,
        scenario_id,
        status: 'draft',
        fbr_invoice_number: null
      }, { transaction: t });

      // Create invoice items if provided
      if (items && Array.isArray(items) && items.length > 0) {
        const invoiceItems = items.map(item => {
          const cleanValue = (value) => {
            if (value === "" || value === "N/A" || value === null || value === undefined) {
              return null;
            }
            return value;
          };

          const cleanNumericValue = (value) => {
            const cleaned = cleanValue(value);
            if (cleaned === null) return null;
            const num = parseFloat(cleaned);
            return isNaN(num) ? null : num;
          };

          return {
            invoice_id: invoice.id,
            hsCode: cleanValue(item.hsCode),
            productDescription: cleanValue(item.productDescription),
            rate: cleanValue(item.rate),
            uoM: cleanValue(item.uoM),
            quantity: cleanNumericValue(item.quantity),
            unitPrice: cleanNumericValue(item.unitPrice),
            totalValues: cleanNumericValue(item.totalValues),
            valueSalesExcludingST: cleanNumericValue(item.valueSalesExcludingST),
            fixedNotifiedValueOrRetailPrice: cleanNumericValue(item.fixedNotifiedValueOrRetailPrice),
            salesTaxApplicable: cleanNumericValue(item.salesTaxApplicable),
            salesTaxWithheldAtSource: cleanNumericValue(item.salesTaxWithheldAtSource),
            extraTax: cleanValue(item.extraTax),
            furtherTax: cleanNumericValue(item.furtherTax),
            sroScheduleNo: cleanValue(item.sroScheduleNo),
            fedPayable: cleanNumericValue(item.fedPayable),
            discount: cleanNumericValue(item.discount),
            saleType: cleanValue(item.saleType),
            sroItemSerialNo: cleanValue(item.sroItemSerialNo),
            billOfLadingUoM: cleanValue(item.billOfLadingUoM)
          };
        });

        await InvoiceItem.bulkCreate(invoiceItems, { transaction: t });
      }

      return invoice;
    });

    res.status(201).json({
      success: true,
      message: 'Invoice saved as draft successfully',
      data: {
        invoice_id: result.id,
        invoice_number: result.invoice_number,
        status: result.status
      }
    });
  } catch (error) {
    console.error('Error saving invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving invoice',
      error: error.message
    });
  }
};

// Save and validate invoice
export const saveAndValidateInvoice = async (req, res) => {
  try {
    const { Invoice, InvoiceItem } = req.tenantModels;
    const { 
      invoiceType, invoiceDate,
      sellerNTNCNIC, sellerBusinessName, sellerProvince, sellerAddress,
      buyerNTNCNIC, buyerBusinessName, buyerProvince, buyerAddress, buyerRegistrationType,
      invoiceRefNo, scenario_id, items 
    } = req.body;

    // Generate a temporary invoice number for saved invoice
    const tempInvoiceNumber = `SAVED_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Validate the data first (basic validation)
    const validationErrors = [];
    
    // Validate seller fields
    if (!sellerNTNCNIC || !sellerBusinessName || !sellerProvince || !sellerAddress) {
      validationErrors.push('Seller information is incomplete');
    }

    // Validate buyer fields
    if (!buyerNTNCNIC || !buyerBusinessName || !buyerProvince || !buyerAddress) {
      validationErrors.push('Buyer information is incomplete');
    }

    // Validate items
    if (!items || items.length === 0) {
      validationErrors.push('At least one item is required');
    } else {
      items.forEach((item, index) => {
        if (!item.hsCode || !item.productDescription || !item.rate || !item.uoM) {
          validationErrors.push(`Item ${index + 1} has incomplete information`);
        }
      });
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Create invoice with saved status
    const result = await req.tenantDb.transaction(async (t) => {
      const invoice = await Invoice.create({
        invoice_number: tempInvoiceNumber,
        invoiceType,
        invoiceDate,
        sellerNTNCNIC,
        sellerBusinessName,
        sellerProvince,
        sellerAddress,
        buyerNTNCNIC,
        buyerBusinessName,
        buyerProvince,
        buyerAddress,
        buyerRegistrationType,
        invoiceRefNo,
        scenario_id,
        status: 'saved',
        fbr_invoice_number: null
      }, { transaction: t });

      // Create invoice items if provided
      if (items && Array.isArray(items) && items.length > 0) {
        const invoiceItems = items.map(item => {
          const cleanValue = (value) => {
            if (value === "" || value === "N/A" || value === null || value === undefined) {
              return null;
            }
            return value;
          };

          const cleanNumericValue = (value) => {
            const cleaned = cleanValue(value);
            if (cleaned === null) return null;
            const num = parseFloat(cleaned);
            return isNaN(num) ? null : num;
          };

          return {
            invoice_id: invoice.id,
            hsCode: cleanValue(item.hsCode),
            productDescription: cleanValue(item.productDescription),
            rate: cleanValue(item.rate),
            uoM: cleanValue(item.uoM),
            quantity: cleanNumericValue(item.quantity),
            unitPrice: cleanNumericValue(item.unitPrice),
            totalValues: cleanNumericValue(item.totalValues),
            valueSalesExcludingST: cleanNumericValue(item.valueSalesExcludingST),
            fixedNotifiedValueOrRetailPrice: cleanNumericValue(item.fixedNotifiedValueOrRetailPrice),
            salesTaxApplicable: cleanNumericValue(item.salesTaxApplicable),
            salesTaxWithheldAtSource: cleanNumericValue(item.salesTaxWithheldAtSource),
            extraTax: cleanValue(item.extraTax),
            furtherTax: cleanNumericValue(item.furtherTax),
            sroScheduleNo: cleanValue(item.sroScheduleNo),
            fedPayable: cleanNumericValue(item.fedPayable),
            discount: cleanNumericValue(item.discount),
            saleType: cleanValue(item.saleType),
            sroItemSerialNo: cleanValue(item.sroItemSerialNo),
            billOfLadingUoM: cleanValue(item.billOfLadingUoM)
          };
        });

        await InvoiceItem.bulkCreate(invoiceItems, { transaction: t });
      }

      return invoice;
    });

    res.status(201).json({
      success: true,
      message: 'Invoice saved and validated successfully',
      data: {
        invoice_id: result.id,
        invoice_number: result.invoice_number,
        status: result.status
      }
    });
  } catch (error) {
    console.error('Error saving and validating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving and validating invoice',
      error: error.message
    });
  }
};

// Get all invoices
export const getAllInvoices = async (req, res) => {
  try {
    const { Invoice, InvoiceItem } = req.tenantModels;
    const { page = 1, limit = 10, search, start_date, end_date, sale_type, status } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Add search functionality
    if (search) {
      whereClause[req.tenantDb.Sequelize.Op.or] = [
        { invoice_number: { [req.tenantDb.Sequelize.Op.like]: `%${search}%` } },
        { buyerBusinessName: { [req.tenantDb.Sequelize.Op.like]: `%${search}%` } },
        { sellerBusinessName: { [req.tenantDb.Sequelize.Op.like]: `%${search}%` } }
      ];
    }

    // Add sale type filter
    if (sale_type && sale_type !== 'All') {
      whereClause.invoiceType = sale_type;
    }

    // Add status filter
    if (status && status !== 'All') {
      whereClause.status = status;
    }

    // Add date range filter
    if (start_date && end_date) {
      whereClause.created_at = {
        [req.tenantDb.Sequelize.Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    const { count, rows } = await Invoice.findAndCountAll({
      where: whereClause,
      include: [{
        model: InvoiceItem,
        as: 'InvoiceItems'
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    // Transform the data to match frontend expectations
    const transformedInvoices = rows.map(invoice => {
      const plainInvoice = invoice.get({ plain: true });
      plainInvoice.items = plainInvoice.InvoiceItems || []; // 👈 normalize for EJS
              return {
          id: plainInvoice.id,
          invoiceNumber: plainInvoice.invoice_number,
          invoiceType: plainInvoice.invoiceType,
          invoiceDate: plainInvoice.invoiceDate,
          sellerNTNCNIC: plainInvoice.sellerNTNCNIC,
          sellerBusinessName: plainInvoice.sellerBusinessName,
          sellerProvince: plainInvoice.sellerProvince,
          sellerAddress: plainInvoice.sellerAddress,
          buyerNTNCNIC: plainInvoice.buyerNTNCNIC,
          buyerBusinessName: plainInvoice.buyerBusinessName,
          buyerProvince: plainInvoice.buyerProvince,
          buyerAddress: plainInvoice.buyerAddress,
          buyerRegistrationType: plainInvoice.buyerRegistrationType,
          invoiceRefNo: plainInvoice.invoiceRefNo,
          scenarioId: plainInvoice.scenario_id,
          status: plainInvoice.status,
          fbr_invoice_number: plainInvoice.fbr_invoice_number,
          items: plainInvoice.InvoiceItems || [],
          created_at: plainInvoice.created_at,
          updated_at: plainInvoice.updated_at
        };
    });

    res.status(200).json({
      success: true,
      data: {
        invoices: transformedInvoices,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_records: count,
          records_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving invoices',
      error: error.message
    });
  }
};

// Get invoice by ID with items
export const getInvoiceById = async (req, res) => {
  try {
    const { Invoice, InvoiceItem } = req.tenantModels;
    const { id } = req.params;

    const invoice = await Invoice.findByPk(id, {
      include: [{
        model: InvoiceItem,
        as: 'InvoiceItems'
      }]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Transform the data to match frontend expectations
    const plainInvoice = invoice.get({ plain: true });
    plainInvoice.items = plainInvoice.InvoiceItems || []; // 👈 normalize for EJS    
    const transformedInvoice = {
      id: plainInvoice.id,
      invoiceNumber: plainInvoice.invoice_number,
      invoiceType: plainInvoice.invoiceType,
      invoiceDate: plainInvoice.invoiceDate,
      sellerNTNCNIC: plainInvoice.sellerNTNCNIC,
      sellerBusinessName: plainInvoice.sellerBusinessName,
      sellerProvince: plainInvoice.sellerProvince,
      sellerAddress: plainInvoice.sellerAddress,
      buyerNTNCNIC: plainInvoice.buyerNTNCNIC,
      buyerBusinessName: plainInvoice.buyerBusinessName,
      buyerProvince: plainInvoice.buyerProvince,
      buyerAddress: plainInvoice.buyerAddress,
      buyerRegistrationType: plainInvoice.buyerRegistrationType,
      invoiceRefNo: plainInvoice.invoiceRefNo,
      scenarioId: plainInvoice.scenario_id,
      status: plainInvoice.status,
      fbr_invoice_number: plainInvoice.fbr_invoice_number,
      items: plainInvoice.InvoiceItems || [],
      created_at: plainInvoice.created_at,
      updated_at: plainInvoice.updated_at
    };

    res.status(200).json({
      success: true,
      data: transformedInvoice
    });
  } catch (error) {
    console.error('Error getting invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving invoice',
      error: error.message
    });
  }
};

// Get invoice by invoice number
export const getInvoiceByNumber = async (req, res) => {
  try {
    const { Invoice, InvoiceItem } = req.tenantModels;
    const { invoiceNumber } = req.params;

    const invoice = await Invoice.findOne({
      where: { invoice_number: invoiceNumber },
      include: [{
        model: InvoiceItem,
        as: 'InvoiceItems'
      }]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Error getting invoice by number:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving invoice',
      error: error.message
    });
  }
};

// Print invoice

export const printInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    // Find invoice across all tenant databases
    const result = await TenantDatabaseService.findInvoiceAcrossTenants(id);
    
    if (!result) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const { invoice, tenantDb } = result;
    const { InvoiceItem } = tenantDb.models;

    // Fetch invoice with items
    const invoiceWithItems = await invoice.constructor.findOne({
      where: { invoice_number: id },
      include: [{ model: InvoiceItem, as: 'InvoiceItems' }]
    });

    if (!invoiceWithItems) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Base64 encode logos
    const fbrLogoBase64 = fs.readFileSync(path.join(process.cwd(), 'public', 'fbr_logo.png')).toString('base64');
    const companyLogoBase64 = fs.readFileSync(path.join(process.cwd(), 'public', 'fbr-logo-1.png')).toString('base64');

    // Prepare paths
    const pdfFileName = `${invoiceWithItems.invoice_number}.pdf`;
    const invoiceDir = path.join(process.cwd(), 'public', 'invoices');
    const pdfPath = path.join(invoiceDir, pdfFileName);

    // Ensure output directory exists
    if (!fs.existsSync(invoiceDir)) {
      fs.mkdirSync(invoiceDir, { recursive: true });
    }

    // Generate QR code
    const qrUrl =   `http://localhost:5150/invoices/${pdfFileName}`;
    const qrData = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: 'M',
      width: 96
    });
    
    const plainInvoice = invoiceWithItems.get({ plain: true });
    plainInvoice.items = plainInvoice.InvoiceItems || []; // 👈 normalize for EJS
    // Render EJS HTML
    const html = await ejs.renderFile(
      path.join(process.cwd(), 'src', 'views', 'invoiceTemplate.ejs'),
      {
        invoice: plainInvoice,
        qrData,
        fbrLogoBase64,
        companyLogoBase64,
        convertToWords: (amount) => {
          const words = toWords(Math.floor(amount || 0));
          return words.charAt(0).toUpperCase() + words.slice(1);
        }
      }
    );

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
    await browser.close();

    // Stream PDF to browser
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${pdfFileName}`);
    fs.createReadStream(pdfPath).pipe(res);

  } catch (error) {
    console.error('PDF generation failed:', error);
    res.status(500).json({
      message: 'Error generating invoice',
      error: error.message
    });
  }
};
// Update invoice
export const updateInvoice = async (req, res) => {
  try {
    const { Invoice } = req.tenantModels;
    const { id } = req.params;
    const updateData = req.body;

    const invoice = await Invoice.findByPk(id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    await invoice.update(updateData);

    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating invoice',
      error: error.message
    });
  }
};

// Delete invoice
export const deleteInvoice = async (req, res) => {
  try {
    const { Invoice } = req.tenantModels;
    const { id } = req.params;

    const invoice = await Invoice.findByPk(id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    await invoice.destroy();

    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting invoice',
      error: error.message
    });
  }
};

// Get invoice statistics
export const getInvoiceStats = async (req, res) => {
  try {
    const { Invoice } = req.tenantModels;
    const { start_date, end_date } = req.query;

    const whereClause = {};
    if (start_date && end_date) {
      whereClause.created_at = {
        [req.tenantDb.Sequelize.Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    const totalInvoices = await Invoice.count({ where: whereClause });
    const totalAmount = await Invoice.sum('totalValues', { where: whereClause });

    // Get invoices by month
    const monthlyStats = await Invoice.findAll({
      attributes: [
        [req.tenantDb.Sequelize.fn('DATE_FORMAT', req.tenantDb.Sequelize.col('created_at'), '%Y-%m'), 'month'],
        [req.tenantDb.Sequelize.fn('COUNT', req.tenantDb.Sequelize.col('id')), 'count'],
        [req.tenantDb.Sequelize.fn('SUM', req.tenantDb.Sequelize.col('totalValues')), 'total_amount']
      ],
      where: whereClause,
      group: [req.tenantDb.Sequelize.fn('DATE_FORMAT', req.tenantDb.Sequelize.col('created_at'), '%Y-%m')],
      order: [[req.tenantDb.Sequelize.fn('DATE_FORMAT', req.tenantDb.Sequelize.col('created_at'), '%Y-%m'), 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        total_invoices: totalInvoices,
        total_amount: totalAmount || 0,
        monthly_stats: monthlyStats
      }
    });
  } catch (error) {
    console.error('Error getting invoice stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving invoice statistics',
      error: error.message
    });
  }
}; 

// Submit saved invoice to FBR
export const submitSavedInvoice = async (req, res) => {
  try {
    const { Invoice, InvoiceItem } = req.tenantModels;
    const { id } = req.params;

    // Find the invoice
    const invoice = await Invoice.findByPk(id, {
      include: [{
        model: InvoiceItem,
        as: 'InvoiceItems'
      }]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (invoice.status !== 'saved') {
      return res.status(400).json({
        success: false,
        message: 'Only saved invoices can be submitted to FBR'
      });
    }

    // Check if scenario_id is provided
    if (!invoice.scenario_id) {
      return res.status(400).json({
        success: false,
        message: 'Scenario ID is required. Please select a scenario before submitting to FBR.'
      });
    }

    // Prepare data for FBR submission
    const fbrData = {
      invoiceType: invoice.invoiceType,
      invoiceDate: invoice.invoiceDate,
      sellerNTNCNIC: invoice.sellerNTNCNIC,
      sellerBusinessName: invoice.sellerBusinessName,
      sellerProvince: invoice.sellerProvince,
      sellerAddress: invoice.sellerAddress,
      buyerNTNCNIC: invoice.buyerNTNCNIC,
      buyerBusinessName: invoice.buyerBusinessName,
      buyerProvince: invoice.buyerProvince,
      buyerAddress: invoice.buyerAddress,
      buyerRegistrationType: invoice.buyerRegistrationType,
      invoiceRefNo: invoice.invoiceRefNo,
      scenario_id: invoice.scenario_id,
      items: invoice.InvoiceItems.map(item => ({
        hsCode: item.hsCode,
        productDescription: item.productDescription,
        rate: item.rate,
        uoM: item.uoM,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalValues: item.totalValues,
        valueSalesExcludingST: item.valueSalesExcludingST,
        fixedNotifiedValueOrRetailPrice: item.fixedNotifiedValueOrRetailPrice,
        salesTaxApplicable: item.salesTaxApplicable,
        salesTaxWithheldAtSource: item.salesTaxWithheldAtSource,
        extraTax: item.extraTax,
        furtherTax: item.furtherTax,
        sroScheduleNo: item.sroScheduleNo,
        fedPayable: item.fedPayable,
        discount: item.discount,
        saleType: item.saleType,
        sroItemSerialNo: item.sroItemSerialNo,
        billOfLadingUoM: item.billOfLadingUoM
      }))
    };

    // Get tenant FBR token from the tenant middleware
    if (!req.tenant || !req.tenant.sandboxTestToken) {
      return res.status(400).json({
        success: false,
        message: 'FBR token not found for this tenant'
      });
    }

    // Import FBR API functions
    const { postData } = await import('../../service/FBRService.js');

    // Submit directly to FBR (skipping validation)
    const postRes = await postData(
      "di_data/v1/di/postinvoicedata_sb",
      fbrData,
      "sandbox",
      req.tenant.sandboxTestToken
    );

    if (postRes.status !== 200 || postRes.data.validationResponse.statusCode !== "00") {
      return res.status(400).json({
        success: false,
        message: 'FBR submission failed',
        details: postRes.data.validationResponse
      });
    }

    // Update invoice status
    await invoice.update({
      status: 'submitted',
      fbr_invoice_number: postRes.data.invoiceNumber
    });

    res.status(200).json({
      success: true,
      message: 'Invoice submitted successfully to FBR',
      data: {
        invoice_id: invoice.id,
        fbr_invoice_number: postRes.data.invoiceNumber,
        status: 'submitted'
      }
    });

  } catch (error) {
    console.error('Error submitting invoice to FBR:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting invoice to FBR',
      error: error.message
    });
  }
};