"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn("kisaan_products", "createdAt", "created_at");
    await queryInterface.renameColumn("kisaan_products", "updatedAt", "updated_at");
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn("kisaan_products", "created_at", "createdAt");
    await queryInterface.renameColumn("kisaan_products", "updated_at", "updatedAt");
  },
};
