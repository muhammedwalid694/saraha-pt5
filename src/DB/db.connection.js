import mongoose from "mongoose";

// Throws on failure so index.js can stop the server instead of running without a DB.
const dbConnection = async () => {
  await mongoose.connect(process.env.DB_URL_LOCAL);
  console.log("Database connected successfully");
};

export default dbConnection;
