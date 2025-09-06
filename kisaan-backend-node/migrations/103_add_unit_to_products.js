"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("kisaan_products", "unit", {
      type: Sequelize.STRING(20),
      allowNull: true,
      defaultValue: null
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("kisaan_products", "unit");
  },
};
