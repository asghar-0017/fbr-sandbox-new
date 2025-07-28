import TenantDatabaseService from '../../service/TenantDatabaseService.js';
import Tenant from '../../model/mysql/Tenant.js';

// Create new tenant (seller registration)
export const createTenant = async (req, res) => {
  try {
    const { seller_ntn_cnic, seller_business_name, seller_province, seller_address,databaseName } = req.body;

    // Validate required fields
    if (!seller_ntn_cnic || !seller_business_name) {
      return res.status(400).json({
        success: false,
        message: 'Seller NTN/CNIC and business name are required'
      });
    }

    // Check if tenant already exists
    const existingTenant = await Tenant.findOne({
      where: { seller_ntn_cnic }
    });

    if (existingTenant) {
      return res.status(409).json({
        success: false,
        message: 'Seller with this NTN/CNIC already exists'
      });
    }

    // Generate unique database name
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 6);

    // Create tenant database
    const result = await TenantDatabaseService.createTenantDatabase({
      seller_ntn_cnic,
      seller_business_name,
      seller_province,
      seller_address,
      databaseName
    });

    res.status(201).json({
      success: true,
      message: 'Tenant created successfully',
      data: {
        tenant_id: result.tenant.tenant_id,
        seller_ntn_cnic: result.tenant.seller_ntn_cnic,
        seller_business_name: result.tenant.seller_business_name,
        database_name: result.databaseName
      }
    });
  } catch (error) {
    console.error('Error creating tenant:', error);
    
    // Handle specific database errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'A tenant with this information already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating tenant',
      error: error.message
    });
  }
};

// Get all tenants
export const getAllTenants = async (req, res) => {
  try {
    const tenants = await TenantDatabaseService.getAllTenants();

    res.status(200).json({
      success: true,
      data: tenants
    });
  } catch (error) {
    console.error('Error getting tenants:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving tenants',
      error: error.message
    });
  }
};

// Get tenant by ID
export const getTenantById = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const tenant = await Tenant.findOne({
      where: { tenant_id: tenantId }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.status(200).json({
      success: true,
      data: tenant
    });
  } catch (error) {
    console.error('Error getting tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving tenant',
      error: error.message
    });
  }
};

// Update tenant
export const updateTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { seller_business_name, seller_province, seller_address } = req.body;

    const tenant = await Tenant.findOne({
      where: { tenant_id: tenantId }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    await tenant.update({
      seller_business_name,
      seller_province,
      seller_address
    });

    res.status(200).json({
      success: true,
      message: 'Tenant updated successfully',
      data: tenant
    });
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating tenant',
      error: error.message
    });
  }
};

// Deactivate tenant
export const deactivateTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const tenant = await Tenant.findOne({
      where: { tenant_id: tenantId }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    await tenant.update({ is_active: false });

    res.status(200).json({
      success: true,
      message: 'Tenant deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Error deactivating tenant',
      error: error.message
    });
  }
};

// Get tenant statistics
export const getTenantStats = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const tenantDb = await TenantDatabaseService.getTenantDatabase(tenantId);
    const { models } = tenantDb;

    // Get counts
    const buyerCount = await models.Buyer.count();
    const invoiceCount = await models.Invoice.count();

    res.status(200).json({
      success: true,
      data: {
        tenant_id: tenantId,
        buyer_count: buyerCount,
        invoice_count: invoiceCount
      }
    });
  } catch (error) {
    console.error('Error getting tenant stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving tenant statistics',
      error: error.message
    });
  }
}; 