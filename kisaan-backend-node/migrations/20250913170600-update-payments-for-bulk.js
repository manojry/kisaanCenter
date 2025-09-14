'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add shop_id field for tracking payments per shop
    await queryInterface.addColumn('kisaan_payments', 'shop_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: 'kisaan_shops',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // Add counterparty_id field for bulk payments
    await queryInterface.addColumn('kisaan_payments', 'counterparty_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: 'kisaan_users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // Make transaction_id nullable for bulk payments
    await queryInterface.changeColumn('kisaan_payments', 'transaction_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'kisaan_transactions',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // Add indexes for performance
    await queryInterface.addIndex('kisaan_payments', ['shop_id']);
    await queryInterface.addIndex('kisaan_payments', ['counterparty_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('kisaan_payments', ['shop_id']);
    await queryInterface.removeIndex('kisaan_payments', ['counterparty_id']);

    // Remove added columns
    await queryInterface.removeColumn('kisaan_payments', 'shop_id');
    await queryInterface.removeColumn('kisaan_payments', 'counterparty_id');

    // Revert transaction_id to not nullable
    await queryInterface.changeColumn('kisaan_payments', 'transaction_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'kisaan_transactions',
        key: 'id',
      },
    });
  },
};
