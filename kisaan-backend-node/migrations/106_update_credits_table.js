"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn("kisaan_credits", "createdAt", "created_at");
    await queryInterface.renameColumn("kisaan_credits", "updatedAt", "updated_at");
    // Add issued_date and due_date columns
    await queryInterface.addColumn("kisaan_credits", "issued_date", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("kisaan_credits", "due_date", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn("kisaan_credits", "created_at", "createdAt");
    await queryInterface.renameColumn("kisaan_credits", "updated_at", "updatedAt");
    await queryInterface.removeColumn("kisaan_credits", "issued_date");
    await queryInterface.removeColumn("kisaan_credits", "due_date");
  },
};
