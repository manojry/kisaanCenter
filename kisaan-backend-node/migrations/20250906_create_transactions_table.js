"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("transactions", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      shop_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "shops",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      buyer_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "kisaan_users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      parent_transaction_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: "transactions",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      type: {
        type: Sequelize.ENUM("sale", "purchase", "refund"),
        allowNull: false,
        defaultValue: "sale",
      },
      status: {
        type: Sequelize.ENUM("pending", "processing", "completed", "cancelled"),
        allowNull: false,
        defaultValue: "pending",
      },
      commission_rate: {
        type: Sequelize.DECIMAL(5,2),
        allowNull: true,
        defaultValue: 0.00,
      },
      commission_amount: {
        type: Sequelize.DECIMAL(12,2),
        allowNull: true,
        defaultValue: 0.00,
      },
      payment_status: {
        type: Sequelize.ENUM("pending", "partial", "completed", "failed"),
        allowNull: false,
        defaultValue: "pending",
      },
      buyer_paid_amount: {
        type: Sequelize.DECIMAL(12,2),
        allowNull: true,
        defaultValue: 0.00,
      },
      farmer_paid_amount: {
        type: Sequelize.DECIMAL(12,2),
        allowNull: true,
        defaultValue: 0.00,
      },
      commission_confirmed: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      completion_status: {
        type: Sequelize.ENUM("incomplete", "complete"),
        allowNull: false,
        defaultValue: "incomplete",
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      record_status: {
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
    await queryInterface.addIndex("transactions", ["shop_id"]);
    await queryInterface.addIndex("transactions", ["buyer_id"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("transactions");
  },
};
