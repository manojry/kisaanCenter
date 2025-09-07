"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("kisaan_credits", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "kisaan_users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      shop_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: "kisaan_shops",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      amount: {
        type: Sequelize.DECIMAL(12,2),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("outstanding", "settled", "overdue"),
        allowNull: false,
        defaultValue: "outstanding",
      },
      record_status: {
        type: Sequelize.ENUM("active", "inactive", "deleted"),
        allowNull: false,
        defaultValue: "active",
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  await queryInterface.addIndex("kisaan_credits", ["user_id"]);
  await queryInterface.addIndex("kisaan_credits", ["shop_id"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("kisaan_credits");
  },
};
