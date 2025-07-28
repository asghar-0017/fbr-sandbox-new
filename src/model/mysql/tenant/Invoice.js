import { DataTypes } from 'sequelize';

// This will be used as a factory function to create Invoice model for each tenant
export const createInvoiceModel = (sequelize) => {
  return sequelize.define('Invoice', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    invoice_number: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    invoice_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    invoice_date: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    seller_ntn_cnic: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    seller_business_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    seller_province: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    seller_address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    buyer_ntn_cnic: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    buyer_business_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    buyer_province: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    buyer_address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    buyer_registration_type: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    invoice_ref_no: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    scenario_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    }
  }, {
    tableName: 'invoices',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
}; 