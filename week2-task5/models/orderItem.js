const { DataTypes, Model } = require("sequelize");

class OrderItem extends Model {}

module.exports = (sequelize) => {
  OrderItem.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      orderId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: "order_id",
        references: { model: "orders", key: "id" },
      },
      productId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: "product_id",
        references: { model: "products", key: "id" },
      },
      quantity: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        validate: { min: 1 },
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: { min: 0.01 },
      },
    },
    {
      sequelize,
      modelName: "OrderItem",
      tableName: "order_items",
      underscored: true,
    },
  );

  return OrderItem;
};
