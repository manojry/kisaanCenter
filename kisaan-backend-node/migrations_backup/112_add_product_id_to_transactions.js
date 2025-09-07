"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("kisaan_transactions", "product_id", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "kisaan_products",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("kisaan_transactions", "product_id");
  },
};
