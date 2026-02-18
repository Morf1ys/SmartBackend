require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product"); // Перевірте шлях до моделі

// Підключення до MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Підключено до MongoDB");
    return Product.deleteMany({}); // Видаляє всі товари з бази даних
  })
  .then(() => {
    console.log("Всі товари успішно видалені з бази даних.");
    mongoose.connection.close(); // Закриває підключення до MongoDB
  })
  .catch((error) => {
    console.error("Помилка при видаленні товарів:", error);
  });
