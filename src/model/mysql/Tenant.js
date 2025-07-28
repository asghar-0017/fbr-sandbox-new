import { DataTypes } from 'sequelize';
import { masterSequelize } from '../../config/mysql.js';

const Tenant = masterSequelize.define('Tenant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tenant_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  seller_ntn_cnic: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  seller_business_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  seller_province: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  seller_address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  database_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'tenants',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Tenant; 