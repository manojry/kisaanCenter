"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn("kisaan_categories", "createdAt", "created_at");
    await queryInterface.renameColumn("kisaan_categories", "updatedAt", "updated_at");
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn("kisaan_categories", "created_at", "createdAt");
    await queryInterface.renameColumn("kisaan_categories", "updated_at", "updatedAt");
  },
};
