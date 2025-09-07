"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Rename columns to match model/seeders
    await queryInterface.renameColumn("kisaan_plans", "createdAt", "created_at");
    await queryInterface.renameColumn("kisaan_plans", "updatedAt", "updated_at");
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn("kisaan_plans", "created_at", "createdAt");
    await queryInterface.renameColumn("kisaan_plans", "updated_at", "updatedAt");
  },
};
