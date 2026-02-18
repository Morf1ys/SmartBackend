// src/models/FailedProduct.js
const mongoose = require("mongoose");

const failedProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: Number,
  description: String,
  category: String, // Текстова категорія, яку можна буде виправити вручну
  imageUrl: [String],
  vendor: String,
  stockQuantity: Number,
  params: { type: Map, of: String },
  error: String, // Поле для зберігання помилки або причини, чому товар не було імпортовано
});

const FailedProduct = mongoose.model("FailedProduct", failedProductSchema);
module.exports = FailedProduct;
