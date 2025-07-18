import express from 'express';
import dotenv from 'dotenv';
import config from './config/index.js';
import connectDb from './dbConnector/index.js';
import helmet from "helmet";
import cors from "cors";
import allRoutes from './routes/allRoutes/index.js';
import path from 'path';
dotenv.config();

const app = express();




app.use(express.json());
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use('/invoices', express.static(path.join(process.cwd(), 'public/invoices')));

app.get('/', (req, res) => {
  res.status(200).json({
    code: "200",
    message: "Maclap Server is Running"
  });
});

allRoutes(app);

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