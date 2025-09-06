"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("kisaan_plans", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      monthly_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      quarterly_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      yearly_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      max_farmers: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      max_buyers: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      max_transactions: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      data_retention_months: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 12,
      },
      features: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("active", "inactive", "deleted"),
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("kisaan_plans");
  },
};
