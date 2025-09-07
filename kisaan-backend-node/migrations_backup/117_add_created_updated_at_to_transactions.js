"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("kisaan_transactions", "created_at", {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });
    await queryInterface.addColumn("kisaan_transactions", "updated_at", {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("kisaan_transactions", "created_at");
    await queryInterface.removeColumn("kisaan_transactions", "updated_at");
  },
};
