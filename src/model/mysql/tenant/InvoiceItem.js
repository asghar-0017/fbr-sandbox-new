import { DataTypes } from 'sequelize';

// This will be used as a factory function to create InvoiceItem model for each tenant
export const createInvoiceItemModel = (sequelize) => {
  return sequelize.define('InvoiceItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    invoice_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'invoices',
        key: 'id'
      }
    },
    hs_code: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    product_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rate: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    uom: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    total_values: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    value_sales_excluding_st: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    fixed_notified_value_or_retail_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    sales_tax_applicable: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    sales_tax_withheld_at_source: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    extra_tax: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    further_tax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    sro_schedule_no: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    fed_payable: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    sale_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    sro_item_serial_no: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 'invoice_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
}; 