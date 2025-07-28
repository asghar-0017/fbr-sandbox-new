import { createTenantConnection } from '../config/mysql.js';
import { createBuyerModel } from '../model/mysql/tenant/Buyer.js';
import { createInvoiceModel } from '../model/mysql/tenant/Invoice.js';
import { createInvoiceItemModel } from '../model/mysql/tenant/InvoiceItem.js';
import Tenant from '../model/mysql/Tenant.js';
import { masterSequelize } from '../config/mysql.js';

class TenantDatabaseService {
  constructor() {
    this.tenantConnections = new Map();
    this.tenantModels = new Map();
  }

  // Create a new tenant database
  async createTenantDatabase(tenantData) {
    try {
      const { seller_ntn_cnic, seller_business_name, seller_province, seller_address, databaseName } = tenantData;
      console.log(tenantData);  
      
      // Generate unique tenant ID
      const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
   
      // Create database connection without specifying database (to create it)
      const tempSequelize = new (await import('sequelize')).Sequelize({
        host: process.env.MYSQL_HOST || 'localhost',
        port: process.env.MYSQL_PORT || 3307,
        username: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || 'root',
        dialect: 'mysql',
        logging: false
      });

      // Create the database
      await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
      await tempSequelize.close();

      // Create tenant record in master database
      const tenant = await Tenant.create({
        tenant_id: tenantId,
        seller_ntn_cnic,
        seller_business_name,
        seller_province,
        seller_address,
        database_name: databaseName,
        is_active: true
      });

      // Initialize tenant database with tables
      await this.initializeTenantDatabase(databaseName);

      return {
        success: true,
        tenant,
        databaseName
      };
    } catch (error) {
      console.error('Error creating tenant database:', error);
      throw error;
    }
  }

  // Initialize tenant database with all required tables
  async initializeTenantDatabase(databaseName) {
    try {
      const sequelize = createTenantConnection(databaseName);
      
      // Create models for this tenant
      const Buyer = createBuyerModel(sequelize);
      const Invoice = createInvoiceModel(sequelize);
      const InvoiceItem = createInvoiceItemModel(sequelize);

      // Define associations
      Invoice.hasMany(InvoiceItem, { foreignKey: 'invoice_id' });
      InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoice_id' });

      // Sync all models to create tables
      await sequelize.sync({ alter: true });

      // Store connection and models
      this.tenantConnections.set(databaseName, sequelize);
      this.tenantModels.set(databaseName, {
        Buyer,
        Invoice,
        InvoiceItem
      });

      console.log(`✅ Tenant database ${databaseName} initialized successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Error initializing tenant database ${databaseName}:`, error);
      throw error;
    }
  }

  // Get tenant database connection and models
  async getTenantDatabase(tenantId) {
    try {
      // Find tenant in master database
      const tenant = await Tenant.findOne({
        where: { 
          tenant_id: tenantId,
          is_active: true 
        }
      });

      if (!tenant) {
        throw new Error('Tenant not found or inactive');
      }

      const databaseName = tenant.database_name;

      // Check if connection already exists
      if (this.tenantConnections.has(databaseName)) {
        return {
          tenant,
          sequelize: this.tenantConnections.get(databaseName),
          models: this.tenantModels.get(databaseName)
        };
      }

      // Create new connection
      const sequelize = createTenantConnection(databaseName);
      
      // Create models
      const Buyer = createBuyerModel(sequelize);
      const Invoice = createInvoiceModel(sequelize);
      const InvoiceItem = createInvoiceItemModel(sequelize);

      // Define associations
      Invoice.hasMany(InvoiceItem, { foreignKey: 'invoice_id' });
      InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoice_id' });

      // Store connection and models
      this.tenantConnections.set(databaseName, sequelize);
      this.tenantModels.set(databaseName, {
        Buyer,
        Invoice,
        InvoiceItem
      });

      return {
        tenant,
        sequelize,
        models: {
          Buyer,
          Invoice,
          InvoiceItem
        }
      };
    } catch (error) {
      console.error('Error getting tenant database:', error);
      throw error;
    }
  }

  // Get tenant database by database name
  async getTenantDatabaseByName(databaseName) {
    try {
      // Find tenant in master database
      const tenant = await Tenant.findOne({
        where: { 
          database_name: databaseName,
          is_active: true 
        }
      });

      if (!tenant) {
        throw new Error('Tenant not found or inactive');
      }

      return await this.getTenantDatabase(tenant.tenant_id);
    } catch (error) {
      console.error('Error getting tenant database by name:', error);
      throw error;
    }
  }

  // List all active tenants
  async getAllTenants() {
    try {
      const tenants = await Tenant.findAll({
        where: { is_active: true },
        attributes: ['id', 'tenant_id', 'seller_ntn_cnic', 'seller_business_name', 'seller_province', 'database_name', 'created_at']
      });

      return tenants;
    } catch (error) {
      console.error('Error getting all tenants:', error);
      throw error;
    }
  }

  // Close all tenant connections
  async closeAllConnections() {
    try {
      for (const [databaseName, sequelize] of this.tenantConnections) {
        await sequelize.close();
        console.log(`✅ Closed connection for ${databaseName}`);
      }
      
      this.tenantConnections.clear();
      this.tenantModels.clear();
    } catch (error) {
      console.error('Error closing tenant connections:', error);
      throw error;
    }
  }
}

export default new TenantDatabaseService(); 