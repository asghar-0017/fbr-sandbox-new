import express from 'express';
import dotenv from 'dotenv';
import helmet from "helmet";
import cors from "cors";
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import ejs from 'ejs';
import https from 'https';
import http from 'http';

// Import MySQL connector instead of MongoDB
import mysqlConnector from './dbConnector/mysqlConnector.js';

// Import new MySQL routes
import authRoutes from './routes/authRoutes.js';
import tenantAuthRoutes from './routes/tenantAuthRoutes.js';

import tenantRoutes from './routes/tenantRoutes.js';
import buyerRoutes from './routes/buyerRoutes.js';
import invoiceRoutes ,{ publicInvoiceRoutes } from './routes/invoiceRoutes.js';

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }))
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'dist')));

app.use(express.json());
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Updated CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5174',
    'http://localhost:3000',
    'http://45.55.137.96:5174',
    'https://45.55.137.96:5174',
    'http://45.55.137.96:5150',
    'https://45.55.137.96:5150'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'Origin', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Add security headers
app.use((req, res, next) => {
  res.header('Cross-Origin-Opener-Policy', 'same-origin');
  res.header('Cross-Origin-Embedder-Policy', 'require-corp');
  res.header('Origin-Agent-Cluster', '?1');
  next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/invoices', express.static(path.join(process.cwd(), 'public/invoices')));
// MySQL Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenant-auth', tenantAuthRoutes);
app.use('/api/admin', tenantRoutes);
app.use('/api/tenant/:tenantId', buyerRoutes);
app.use('/api/tenant/:tenantId', invoiceRoutes);

// Public Invoice Routes
app.use('/api', publicInvoiceRoutes);

// Catch-all route for SPA - must be last
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});


export const logger = {
  info: (msg) => console.log(`INFO: ${msg}`),
  error: (msg) => console.error(`ERROR: ${msg}`),
};

const startServer = async () => {
  try { 
    // Initialize MySQL instead of MongoDB
    await mysqlConnector({}, logger);
    console.log("✅ Connected to MySQL multi-tenant database system");
    
    const port = process.env.PORT || 5150;
    const httpsPort = process.env.HTTPS_PORT || 5151;
    
    // Create HTTP server
    const httpServer = http.createServer(app);
    httpServer.listen(port, () => {
      console.log('🚀 HTTP Server is running on port', port);
    });
    
    // Create HTTPS server if SSL certificates exist
    const sslPath = path.join(process.cwd(), 'ssl');
    const certPath = path.join(sslPath, 'cert.pem');
    const keyPath = path.join(sslPath, 'key.pem');
    
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      const httpsOptions = {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath)
      };
      
      const httpsServer = https.createServer(httpsOptions, app);
      httpsServer.listen(httpsPort, () => {
        console.log('🔒 HTTPS Server is running on port', httpsPort);
      });
    } else {
      console.log('⚠️  SSL certificates not found. HTTPS server not started.');
      console.log('📝 To enable HTTPS, create SSL certificates in the ssl/ directory');
    }
    
    console.log('📋 MySQL Multi-Tenant System Ready!');
    console.log('🔗 API Endpoints:');
    console.log(`   HTTP:  http://localhost:${port}`);
    console.log(`   HTTPS: https://localhost:${httpsPort} (if SSL enabled)`);
     
  } catch (error) {
    console.log("❌ Error starting server", error);
    process.exit(1);
  }
};

export default startServer;