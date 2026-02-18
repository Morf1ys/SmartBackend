require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product"); // Основна модель Product
const FailedProduct = require("./models/FailedProduct"); // Модель для товарів з помилками

// Підключення до MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function moveCorrectedProducts() {
  try {
    // Знайти всі товари в FailedProduct, які тепер мають дійсну категорію
    const correctedProducts = await FailedProduct.find({
      category: { $exists: true, $ne: null },
    });

    // Перенесення товарів у колекцію Products
    for (let product of correctedProducts) {
      const newProduct = new Product({
        name: product.name,
        price: product.price,
        description: product.description,
        category: product.category, // Тут передбачено, що `category` тепер має правильний ObjectId
        imageUrl: product.imageUrl,
        vendor: product.vendor,
        stockQuantity: product.stockQuantity,
        params: product.params,
      });

      await newProduct.save(); // Зберігаємо в Products
      await FailedProduct.deleteOne({ _id: product._id }); // Видаляємо з FailedProduct після перенесення
      console.log(`Товар "${product.name}" успішно перенесено в Products`);
    }

    console.log("Перенесення завершено");
  } catch (error) {
    console.error("Помилка перенесення:", error);
  } finally {
    mongoose.connection.close();
  }
}

moveCorrectedProducts();
