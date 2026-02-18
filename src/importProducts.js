require("dotenv").config();
const axios = require("axios");
const xml2js = require("xml2js");
const mongoose = require("mongoose");
const Product = require("./models/Product");
const Category = require("./models/Category");
const FailedProduct = require("./models/FailedProduct");
const categoryMap = require("./categoryMap");

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("Error connecting to MongoDB:", error));

async function importProducts() {
  try {
    const response = await axios.get(
      "https://vingoods.prom.ua/products_feed.xml?hash_tag=304a1e9350e8e010372f52315c1b2fa5&sales_notes=&product_ids=&label_ids=&exclude_fields=&html_description=0&yandex_cpa=&process_presence_sure=&languages=uk%2Cru&extra_fields=quantityInStock%2Ckeywords&group_ids="
    );
    const data = response.data;

    return new Promise((resolve, reject) => {
      xml2js.parseString(data, async (err, result) => {
        if (err) {
          console.error("Error parsing XML:", err);
          return reject(err);
        }

        const offers = result.yml_catalog.shop[0].offers[0].offer;
        let successfulCount = 0;
        let failedCount = 0;
        let inStockCount = 0;

        for (let offer of offers) {
          const externalCategoryId = offer.categoryId[0];
          const matchedCategoryId = categoryMap[externalCategoryId];

          // Зменшуємо ціну на 10% та округлюємо її до цілого числа
          const discountedPrice = Math.round(parseFloat(offer.price[0]) * 0.9);
          const oldPrice = offer.oldprice
            ? parseFloat(offer.oldprice[0])
            : null;

          const productData = {
            name: offer.name[0],
            price: discountedPrice,
            priceOld: oldPrice,
            currencyId: offer.currencyId ? offer.currencyId[0] : "UAH",
            description: offer.description ? offer.description[0] : "",
            category: matchedCategoryId,
            imageUrl: offer.picture,
            vendor: offer.vendor ? offer.vendor[0] : null,
            stockQuantity: parseInt(offer.quantity_in_stock[0], 10) || 0,
            params: offer.param?.reduce((acc, param) => {
              const sanitizedKey = param.$.name.replace(/\./g, "_");
              acc[sanitizedKey] = param._;
              return acc;
            }, {}),
          };

          if (matchedCategoryId) {
            await Product.findOneAndUpdate(
              { name: productData.name },
              productData,
              { upsert: true, new: true }
            );
            successfulCount++;
            if (productData.stockQuantity > 0) {
              inStockCount++;
            }
          } else {
            // Перевірка, чи товар вже існує в Products
            const existingProduct = await Product.findOne({
              name: productData.name,
            });
            if (!existingProduct) {
              // Якщо категорія не знайдена і товару немає в Products, зберігаємо товар в FailedProducts
              await FailedProduct.create({
                ...productData,
                category: externalCategoryId,
                error: `Category ID ${externalCategoryId} not found`,
              });
              failedCount++;
            } else {
              console.log(
                `Товар "${productData.name}" вже існує в Products і буде пропущений.`
              );
            }
          }
        }

        console.log(`Імпорт успішно завершено`);
        console.log(`Успішно імпортовано товарів: ${successfulCount}`);
        console.log(`Неуспішно імпортовано товарів: ${failedCount}`);
        console.log(`Товарів в наявності: ${inStockCount}`);
        resolve();
      });
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

importProducts().then(() => mongoose.connection.close());
