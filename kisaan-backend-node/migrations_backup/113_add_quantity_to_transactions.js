"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("kisaan_transactions", "quantity", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("kisaan_transactions", "quantity");
  },
};
