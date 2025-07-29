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
      invoiceRefNo, scenario_id, items 
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
        scenario_id
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
            sroItemSerialNo: cleanValue(item.sroItemSerialNo)
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
        invoice_number: result.invoice_number
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

// Get all invoices
export const getAllInvoices = async (req, res) => {
  try {
    const { Invoice, InvoiceItem } = req.tenantModels;
    const { page = 1, limit = 10, search, start_date, end_date } = req.query;

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
    const qrUrl =   `https://einvoice.inplsoftwares/invoices/${pdfFileName}`;
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


