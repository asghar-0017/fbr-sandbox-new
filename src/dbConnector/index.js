import mongoose from 'mongoose'


const dbConnector = async (dbConfig, logger) => {
  const uri = `mongodb+srv://${dbConfig.user}:${dbConfig.password}@${dbConfig.baseUrl}/${dbConfig.dbName}?retryWrites=true&w=majority`;
  try {
    await mongoose.connect(uri, {
    });
  } catch (error) {
    logger.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default dbConnector;