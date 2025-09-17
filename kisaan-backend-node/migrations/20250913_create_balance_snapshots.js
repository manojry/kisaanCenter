'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('balance_snapshots', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      balance: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      snapshot_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  try { await queryInterface.addIndex('balance_snapshots', ['user_id', 'snapshot_date']); } catch (e) {}
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('balance_snapshots');
  },
};
