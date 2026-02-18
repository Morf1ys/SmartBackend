require("dotenv").config();
const mongoose = require("mongoose");
const FailedProduct = require("./models/FailedProduct"); // Імпортуйте модель FailedProduct

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("Error connecting to MongoDB:", error));

async function clearFailedProducts() {
  try {
    const result = await FailedProduct.deleteMany({});
    console.log(
      `Колекція FailedProducts очищена. Видалено ${result.deletedCount} документів.`
    );
  } catch (error) {
    console.error("Помилка під час очищення колекції FailedProducts:", error);
  } finally {
    mongoose.connection.close();
  }
}

clearFailedProducts();
