const test = require("node:test");
const assert = require("node:assert/strict");
const { User, Product, Order, OrderItem, sequelize } = require("../models");

test("all Sequelize associations use the intended foreign keys", () => {
  assert.equal(User.associations.orders.associationType, "HasMany");
  assert.equal(User.associations.orders.foreignKey, "userId");
  assert.equal(Order.associations.user.associationType, "BelongsTo");
  assert.equal(Order.associations.user.foreignKey, "userId");
  assert.equal(Order.associations.orderItems.associationType, "HasMany");
  assert.equal(OrderItem.associations.order.foreignKey, "orderId");
  assert.equal(Product.associations.orderItems.associationType, "HasMany");
  assert.equal(OrderItem.associations.product.foreignKey, "productId");
});

test("required model constraints match the migrations", () => {
  assert.equal(User.getAttributes().email.unique, true);
  assert.equal(Product.getAttributes().price.allowNull, false);
  assert.equal(Product.getAttributes().stockQuantity.allowNull, false);
  assert.equal(Order.getAttributes().userId.allowNull, false);
  assert.equal(OrderItem.getAttributes().orderId.allowNull, false);
  assert.equal(OrderItem.getAttributes().productId.allowNull, false);
});

test.after(async () => {
  await sequelize.close();
});
