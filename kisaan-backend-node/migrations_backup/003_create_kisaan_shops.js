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
      plan_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'kisaan_plans',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.ENUM("active", "inactive"),
        allowNull: false,
        defaultValue: "active",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
    // Only create index if it does not exist
    try {
      await queryInterface.addIndex("kisaan_shops", ["owner_id"], { name: "kisaan_shops_owner_id_idx" });
    } catch (e) {
      if (!e.message.includes('already exists')) throw e;
    }
    try {
      await queryInterface.addIndex("kisaan_shops", ["status"], { name: "kisaan_shops_status_idx" });
    } catch (e) {
      if (!e.message.includes('already exists')) throw e;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Drop kisaan_shop_categories first if it exists, to avoid FK constraint errors
    await queryInterface.dropTable("kisaan_shop_categories", { force: true }).catch(() => {});
    await queryInterface.dropTable("kisaan_shops");
  },
};
