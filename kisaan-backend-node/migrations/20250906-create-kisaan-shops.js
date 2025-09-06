"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("kisaan_shops", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      owner_id: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      address: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      contact: {
        type: Sequelize.STRING(15),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("active", "inactive"),
        allowNull: false,
        defaultValue: "active",
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  await queryInterface.addIndex("kisaan_shops", ["owner_id"], { name: "kisaan_shops_owner_id_idx" });
  await queryInterface.addIndex("kisaan_shops", ["status"], { name: "kisaan_shops_status_idx" });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("kisaan_shops");
  },
};
