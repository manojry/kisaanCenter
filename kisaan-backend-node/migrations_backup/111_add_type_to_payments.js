"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Only add the column if it does not exist
    const table = await queryInterface.describeTable("kisaan_payments");
    if (!table.type) {
      await queryInterface.addColumn("kisaan_payments", "type", {
        type: Sequelize.ENUM("full", "partial", "credit"),
        allowNull: false,
        defaultValue: "full",
      });
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("kisaan_payments", "type");
  },
};
