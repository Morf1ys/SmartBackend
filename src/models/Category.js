// src/models/Category.js
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  subcategories: [
    {
      name: String,
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId(),
      },
    },
  ],
});

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;
