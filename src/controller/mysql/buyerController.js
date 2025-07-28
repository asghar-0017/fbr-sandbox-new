// Buyer controller for multi-tenant MySQL system
// This controller uses req.tenantModels.Buyer from tenant middleware

// Create new buyer
export const createBuyer = async (req, res) => {
  try {

    
    const { Buyer } = req.tenantModels;
    const { buyerNTNCNIC, buyerBusinessName, buyerProvince, buyerAddress, buyerRegistrationType } = req.body;

    // Validate required fields
    if (!buyerProvince || !buyerRegistrationType) {
      return res.status(400).json({
        success: false,
        message: 'Buyer province and registration type are required'
      });
    }

    // Create buyer
    const buyer = await Buyer.create({
      buyerNTNCNIC,
      buyerBusinessName,
      buyerProvince,
      buyerAddress,
      buyerRegistrationType
    });

    res.status(201).json({
      success: true,
      message: 'Buyer created successfully',
      data: buyer
    });
  } catch (error) {
    console.error('Error creating buyer:', error);
    
    // Handle specific database errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(e => e.message)
      });
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Buyer with this NTN/CNIC already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating buyer',
      error: error.message
    });
  }
};

// Get all buyers
export const getAllBuyers = async (req, res) => {
  try {
    const { Buyer } = req.tenantModels;
    const { page = 1, limit = 10, search } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Add search functionality
    if (search) {
      whereClause[req.tenantDb.Sequelize.Op.or] = [
        { buyerNTNCNIC: { [req.tenantDb.Sequelize.Op.like]: `%${search}%` } },
        { buyerBusinessName: { [req.tenantDb.Sequelize.Op.like]: `%${search}%` } },
        { buyerProvince: { [req.tenantDb.Sequelize.Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Buyer.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        buyers: rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_records: count,
          records_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting buyers:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving buyers',
      error: error.message
    });
  }
};

// Get buyer by ID
export const getBuyerById = async (req, res) => {
  try {
    const { Buyer } = req.tenantModels;
    const { id } = req.params;

    const buyer = await Buyer.findByPk(id);

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: buyer
    });
  } catch (error) {
    console.error('Error getting buyer:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving buyer',
      error: error.message
    });
  }
};

// Update buyer
export const updateBuyer = async (req, res) => {
  try {
    const { Buyer } = req.tenantModels;
    const { id } = req.params;
    const { buyerNTNCNIC, buyerBusinessName, buyerProvince, buyerAddress, buyerRegistrationType } = req.body;

    const buyer = await Buyer.findByPk(id);

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    await buyer.update({
      buyerNTNCNIC,
      buyerBusinessName,
      buyerProvince,
      buyerAddress,
      buyerRegistrationType
    });

    res.status(200).json({
      success: true,
      message: 'Buyer updated successfully',
      data: buyer
    });
  } catch (error) {
    console.error('Error updating buyer:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating buyer',
      error: error.message
    });
  }
};

// Delete buyer
export const deleteBuyer = async (req, res) => {
  try {
    const { Buyer } = req.tenantModels;
    const { id } = req.params;

    const buyer = await Buyer.findByPk(id);

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    await buyer.destroy();

    res.status(200).json({
      success: true,
      message: 'Buyer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting buyer:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting buyer',
      error: error.message
    });
  }
};

// Get buyers by province
export const getBuyersByProvince = async (req, res) => {
  try {
    const { Buyer } = req.tenantModels;
    const { province } = req.params;

    const buyers = await Buyer.findAll({
      where: { buyerProvince: province },
      order: [['buyerBusinessName', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: buyers
    });
  } catch (error) {
    console.error('Error getting buyers by province:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving buyers by province',
      error: error.message
    });
  }
}; 