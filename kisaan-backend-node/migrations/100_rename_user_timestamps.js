"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn("kisaan_users", "createdAt", "created_at");
    await queryInterface.renameColumn("kisaan_users", "updatedAt", "updated_at");
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn("kisaan_users", "created_at", "createdAt");
    await queryInterface.renameColumn("kisaan_users", "updated_at", "updatedAt");
  },
};
