import express from 'express';
import dotenv from 'dotenv';
import config from './config/index.js';
import connectDb from './dbConnector/index.js';
import helmet from "helmet";
import cors from "cors";
// import allRoutes from './routes/allRoutes/index.js';
import path from 'path';
import fs from 'fs';
import os from 'os';

dotenv.config();

const app = express();


import { fileURLToPath } from 'url';
import { dirname } from 'path';

app.use(express.urlencoded({ extended: false }))
app.use(express.static('public'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'dist')));

app.use(express.json());
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/invoices', express.static(path.join(process.cwd(), 'public/invoices')));
app.use(express.static(path.join(__dirname, 'dist')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// allRoutes(app);

export const logger = {
  info: (msg) => console.log(`INFO: ${msg}`),
  error: (msg) => console.error(`ERROR: ${msg}`),
};

const startServer = async () => {
  try {
    connectDb(config.db, logger);
    console.log("Connected to database");
    const port = process.env.PORT || 5173;
    app.listen(port, () => {
      console.log('Server is running on port', port);
    });
  } catch (error) {
    console.log("Error starting server", error);
  }
};

export default startServer;