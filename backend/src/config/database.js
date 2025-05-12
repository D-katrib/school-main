const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    let conn;
    
    try {
      // First try connecting to the configured MongoDB URI
      conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myschool', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (initialError) {
      console.log(`Could not connect to MongoDB: ${initialError.message}`);
      console.log('Falling back to in-memory MongoDB server...');
      
      // If that fails, start an in-memory MongoDB server
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      
      conn = await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      
      console.log(`In-Memory MongoDB Server Connected: ${conn.connection.host}`);
      
      // Store the mongod instance to make it accessible for cleanup
      global.__MONGOD__ = mongod;
    }
    
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
