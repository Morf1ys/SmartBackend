require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Category = require("./models/Category");

async function clearCategories() {
  await Category.deleteMany({});
  console.log("All categories have been deleted.");
  mongoose.disconnect();
}

clearCategories();
