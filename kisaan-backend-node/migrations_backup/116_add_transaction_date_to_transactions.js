"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add missing columns to match the model
    await queryInterface.addColumn("kisaan_transactions", "transaction_date", {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("kisaan_transactions", "transaction_date");
  },
};
