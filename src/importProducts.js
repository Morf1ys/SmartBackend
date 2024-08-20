require("dotenv").config();
const axios = require("axios");
const xml2js = require("xml2js");
const mongoose = require("mongoose");
const Product = require("./models/Product");
const cron = require("node-cron");

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
    // Запускаємо імпорт одразу після запуску
    importProducts();
    // Налаштовуємо виконання імпорту кожні 2 години
    cron.schedule("0 */2 * * *", () => {
      console.log("Starting product import...");
      importProducts();
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

async function importProducts() {
  try {
    const response = await axios.get(
      "https://vingoods.com.ua/index.php?route=extension/feed/yandex_yml&token=vingoodscomuarozetka"
    );
    const data = response.data;

    return new Promise((resolve, reject) => {
      xml2js.parseString(data, async (err, result) => {
        if (err) {
          console.error("Error parsing XML:", err);
          return reject(err);
        }

        const offers = result.yml_catalog.shop[0].offers[0].offer;
        const categories = result.yml_catalog.shop[0].categories[0].category;

        const categoryMap = {};
        categories.forEach((category) => {
          categoryMap[category.$.id] = category._;
        });

        for (let i = 0; i < offers.length; i++) {
          const offer = offers[i];
          const categoryId = offer.categoryId[0];
          const categoryName = categoryMap[categoryId] || "Uncategorized";

          const params = {};
          if (offer.param) {
            offer.param.forEach((param) => {
              const sanitizedKey = param.$.name.replace(/\./g, "_");
              params[sanitizedKey] = param._;
            });
          }

          const originalPrice = parseFloat(offer.price[0]);
          const discountedPrice = Math.round(originalPrice * 0.86);

          const productData = {
            name: offer.name[0],
            price: discountedPrice,
            priceOld: offer.price_old ? offer.price_old[0] : null,
            currencyId: offer.currencyId ? offer.currencyId[0] : null,
            description: offer.description ? offer.description[0] : "",
            imageUrl: offer.picture,
            category: categoryName,
            vendor: offer.vendor ? offer.vendor[0] : null,
            delivery: offer.delivery ? offer.delivery[0] === "true" : false,
            stockQuantity: offer.stock_quantity
              ? parseInt(offer.stock_quantity[0], 10)
              : 0,
            params: params,
          };

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
        }

        console.log("Import completed successfully");
        resolve(); // Розв'язуємо проміс після завершення імпорту
      });
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}
