require("dotenv").config(); // Завантажуємо змінні з .env файлу
const cron = require("node-cron");
const axios = require("axios");
const xml2js = require("xml2js");
const mongoose = require("mongoose");
const Product = require("./models/Product");

// Підключення до бази даних MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB");

  // Налаштування cron-завдання для запуску скрипта кожні 2 години
  cron.schedule("0 */2 * * *", async () => {
    console.log("Running import task...");
    await importProducts();
  });

  // Для першого запуску, викликаємо importProducts одразу
  importProducts();
});

mongoose.connection.on("error", (err) => {
  console.error("Error connecting to MongoDB:", err);
});

async function importProducts() {
  try {
    const response = await axios.get(
      "https://vingoods.com.ua/index.php?route=extension/feed/yandex_yml&token=vingoodscomuarozetka"
    );
    const data = response.data;

    xml2js.parseString(data, async (err, result) => {
      if (err) {
        console.error("Error parsing XML:", err);
        return;
      }

      const offers = result.yml_catalog.shop[0].offers[0].offer;

      for (let i = 0; i < offers.length; i++) {
        const offer = offers[i];
        const productData = {
          name: offer.name[0],
          price: offer.price[0],
          description: offer.description ? offer.description[0] : "",
          imageUrl: offer.picture ? offer.picture[0] : "",
        };

        try {
          const existingProduct = await Product.findOne({
            name: productData.name,
          });

          if (existingProduct) {
            await Product.updateOne({ _id: existingProduct._id }, productData);
            console.log(`Product ${productData.name} updated in the database`);
          } else {
            const newProduct = new Product(productData);
            await newProduct.save();
            console.log(`Product ${productData.name} added to the database`);
          }
        } catch (dbError) {
          console.error("Database operation failed:", dbError);
        }
      }

      console.log("Import completed successfully");
    });
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}
