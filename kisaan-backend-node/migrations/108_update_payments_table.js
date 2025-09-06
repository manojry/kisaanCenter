"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn("kisaan_payments", "createdAt", "created_at");
    await queryInterface.renameColumn("kisaan_payments", "updatedAt", "updated_at");
    await queryInterface.addColumn("kisaan_payments", "payment_type", {
      type: Sequelize.ENUM("full", "partial", "advance"),
      allowNull: false,
      defaultValue: "full",
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn("kisaan_payments", "created_at", "createdAt");
    await queryInterface.renameColumn("kisaan_payments", "updated_at", "updatedAt");
    await queryInterface.removeColumn("kisaan_payments", "payment_type");
  },
};
