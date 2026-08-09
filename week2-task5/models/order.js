const { DataTypes, Model } = require("sequelize");

class Order extends Model {}

module.exports = (sequelize) => {
  Order.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: "user_id",
        references: { model: "users", key: "id" },
      },
      orderDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "order_date",
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: "total_amount",
        validate: { min: 0 },
      },
    },
    {
      sequelize,
      modelName: "Order",
      tableName: "orders",
      underscored: true,
    },
  );

  return Order;
};
