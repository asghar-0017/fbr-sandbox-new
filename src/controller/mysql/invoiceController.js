// Invoice controller for multi-tenant MySQL system
// This controller uses req.tenantModels.Invoice and req.tenantModels.InvoiceItem from tenant middleware

// Create new invoice with items
export const createInvoice = async (req, res) => {
  try {
    const { Invoice, InvoiceItem } = req.tenantModels;
    const { 
      invoice_number, invoice_type, invoice_date,
      seller_ntn_cnic, seller_business_name, seller_province, seller_address,
      buyer_ntn_cnic, buyer_business_name, buyer_province, buyer_address, buyer_registration_type,
      invoice_ref_no, scenario_id, items 
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
        invoice_type,
        invoice_date,
        seller_ntn_cnic,
        seller_business_name,
        seller_province,
        seller_address,
        buyer_ntn_cnic,
        buyer_business_name,
        buyer_province,
        buyer_address,
        buyer_registration_type,
        invoice_ref_no,
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
            hs_code: cleanValue(item.hsCode),
            product_description: cleanValue(item.productDescription),
            rate: cleanValue(item.rate),
            uom: cleanValue(item.uoM),
            quantity: cleanNumericValue(item.quantity),
            unit_price: cleanNumericValue(item.unitPrice),
            total_values: cleanNumericValue(item.totalValues),
            value_sales_excluding_st: cleanNumericValue(item.valueSalesExcludingST),
            fixed_notified_value_or_retail_price: cleanNumericValue(item.fixedNotifiedValueOrRetailPrice),
            sales_tax_applicable: cleanNumericValue(item.salesTaxApplicable),
            sales_tax_withheld_at_source: cleanNumericValue(item.salesTaxWithheldAtSource),
            extra_tax: cleanValue(item.extraTax),
            further_tax: cleanNumericValue(item.furtherTax),
            sro_schedule_no: cleanValue(item.sroScheduleNo),
            fed_payable: cleanNumericValue(item.fedPayable),
            discount: cleanNumericValue(item.discount),
            sale_type: cleanValue(item.saleType),
            sro_item_serial_no: cleanValue(item.sroItemSerialNo)
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
    const { Invoice } = req.tenantModels;
    const { page = 1, limit = 10, search, start_date, end_date } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Add search functionality
    if (search) {
      whereClause[req.tenantDb.Sequelize.Op.or] = [
        { invoice_number: { [req.tenantDb.Sequelize.Op.like]: `%${search}%` } },
        { buyer_business_name: { [req.tenantDb.Sequelize.Op.like]: `%${search}%` } },
        { seller_business_name: { [req.tenantDb.Sequelize.Op.like]: `%${search}%` } }
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
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        invoices: rows,
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

    res.status(200).json({
      success: true,
      data: invoice
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
    const totalAmount = await Invoice.sum('total_values', { where: whereClause });

    // Get invoices by month
    const monthlyStats = await Invoice.findAll({
      attributes: [
        [req.tenantDb.Sequelize.fn('DATE_FORMAT', req.tenantDb.Sequelize.col('created_at'), '%Y-%m'), 'month'],
        [req.tenantDb.Sequelize.fn('COUNT', req.tenantDb.Sequelize.col('id')), 'count'],
        [req.tenantDb.Sequelize.fn('SUM', req.tenantDb.Sequelize.col('total_values')), 'total_amount']
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