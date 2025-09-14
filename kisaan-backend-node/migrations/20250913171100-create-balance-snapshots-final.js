'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop table if it exists and recreate it
    await queryInterface.dropTable('balance_snapshots').catch(() => {
      // Ignore error if table doesn't exist
    });

    await queryInterface.createTable('balance_snapshots', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'kisaan_users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      balance: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      snapshot_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes for performance
    await queryInterface.addIndex('balance_snapshots', ['user_id']);
    await queryInterface.addIndex('balance_snapshots', ['snapshot_date']);
    await queryInterface.addIndex('balance_snapshots', ['user_id', 'snapshot_date']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('balance_snapshots');
  },
};
