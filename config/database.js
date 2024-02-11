import mongoose from "mongoose";

export const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("Connected to database.");
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
};
