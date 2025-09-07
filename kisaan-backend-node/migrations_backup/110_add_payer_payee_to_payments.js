"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("kisaan_payments", "payer_id", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
    });
    await queryInterface.addColumn("kisaan_payments", "payee_id", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("kisaan_payments", "payer_id");
    await queryInterface.removeColumn("kisaan_payments", "payee_id");
  },
};
