const { Sequelize } = require("sequelize");
const config = require("../config/config")[process.env.NODE_ENV || "development"];
const defineUser = require("./user");
const defineProduct = require("./product");
const defineOrder = require("./order");
const defineOrderItem = require("./orderItem");

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config,
);

const User = defineUser(sequelize);
const Product = defineProduct(sequelize);
const Order = defineOrder(sequelize);
const OrderItem = defineOrderItem(sequelize);

User.hasMany(Order, {
  as: "orders",
  foreignKey: "userId",
});

Order.belongsTo(User, {
  as: "user",
  foreignKey: "userId",
});

Order.hasMany(OrderItem, {
  as: "orderItems",
  foreignKey: "orderId",
  onDelete: "CASCADE",
});

OrderItem.belongsTo(Order, {
  as: "order",
  foreignKey: "orderId",
});

Product.hasMany(OrderItem, {
  as: "orderItems",
  foreignKey: "productId",
});

OrderItem.belongsTo(Product, {
  as: "product",
  foreignKey: "productId",
});

module.exports = {
  sequelize,
  Sequelize,
  User,
  Product,
  Order,
  OrderItem,
};
