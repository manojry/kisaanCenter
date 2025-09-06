"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("credits", {
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
          model: "shops",
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
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
    await queryInterface.addIndex("credits", ["user_id"]);
    await queryInterface.addIndex("credits", ["shop_id"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("credits");
  },
};
