"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("products", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      category_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: "categories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
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
    await queryInterface.addIndex("products", ["name"]);
    await queryInterface.addIndex("products", ["category_id"]);
    await queryInterface.addIndex("products", ["shop_id"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("products");
  },
};
