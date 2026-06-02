const mongoose = require("mongoose");

async function connectMongo(uri = process.env.MONGO_URI) {
  if (!uri) {
    throw new Error("MONGO_URI is required to connect to MongoDB");
  }

  mongoose.set("strictQuery", true);

  return mongoose.connect(uri);
}

module.exports = {
  connectMongo,
  mongoose,
};
