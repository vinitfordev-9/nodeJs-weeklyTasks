const { DataTypes, Model } = require("sequelize");

class Product extends Model {}

module.exports = (sequelize) => {
  Product.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      productName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: "product_name",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0.01 },
      },
      stockQuantity: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: "stock_quantity",
        validate: { min: 0 },
      },
    },
    {
      sequelize,
      modelName: "Product",
      tableName: "products",
      underscored: true,
    },
  );

  return Product;
};
