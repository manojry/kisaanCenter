'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
  await queryInterface.createTable('kisaan_users', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role: {
        type: Sequelize.ENUM('superadmin', 'owner', 'farmer', 'buyer'),
        allowNull: false,
      },
      owner_id: {
        type: Sequelize.STRING,
        allowNull: true, // null for superadmin/owner, required for farmer/buyer
      },
      shop_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      contact: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
      created_by: {
        type: Sequelize.INTEGER.UNSIGNED,
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
  await queryInterface.addIndex('kisaan_users', ['username'], { unique: true });
  await queryInterface.addIndex('kisaan_users', ['owner_id']);
  await queryInterface.addIndex('kisaan_users', ['shop_id']);
  await queryInterface.addIndex('kisaan_users', ['role']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('kisaan_users');
  },
};
