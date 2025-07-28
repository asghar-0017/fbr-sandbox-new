import { DataTypes } from 'sequelize';

// This will be used as a factory function to create Buyer model for each tenant
export const createBuyerModel = (sequelize) => {
  return sequelize.define('Buyer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
      allowNull: false
    },
    buyer_address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    buyer_registration_type: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    tableName: 'buyers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
}; 