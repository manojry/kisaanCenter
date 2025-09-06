"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("plans", {
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
  // Removed explicit unique index creation for plans.name to avoid duplicate index error
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("plans");
  },
};
