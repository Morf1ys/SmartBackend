const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  priceOld: {
    type: Number,
  },
  currencyId: {
    type: String,
  },
  description: {
    type: String,
  },
  imageUrl: {
    type: [String],
  },
  category: {
    type: String,
    required: true,
  },
  vendor: {
    type: String,
  },
  delivery: {
    type: Boolean,
  },
  stockQuantity: {
    type: Number,
  },
  params: {
    type: Map,
    of: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
