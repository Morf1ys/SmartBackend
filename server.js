require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

const Product = require("./src/models/Product");

// Маршрут для отримання списку товарів у форматі XML або JSON
app.get("/product-feed", async (req, res) => {
  try {
    const products = await Product.find();

    const acceptHeader = req.headers.accept;

    if (acceptHeader && acceptHeader.includes("application/json")) {
      // Повертаємо дані у форматі JSON
      res.json({ products });
    } else {
      // Повертаємо дані у форматі XML
      let feed = '<?xml version="1.0" encoding="UTF-8"?>';
      feed += "<products>";

      products.forEach((product) => {
        feed += `
          <product>
            <id>${product._id}</id>
            <name>${product.name}</name>
            <price>${product.price}</price>
            <description>${product.description}</description>
            <image>${product.imageUrl}</image>
          </product>
        `;
      });

      feed += "</products>";
      res.header("Content-Type", "application/xml");
      res.send(feed);
    }
  } catch (error) {
    res.status(500).send("Error generating feed");
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
