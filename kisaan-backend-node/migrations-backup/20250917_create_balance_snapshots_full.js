'use strict';


module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add missing balance_type column if not present
    try { await queryInterface.addColumn('balance_snapshots', 'balance_type', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'farmer',
      comment: 'Type of balance (farmer, buyer, etc.)',
    }); } catch (e) {}
    // Add new audit/history columns to existing balance_snapshots table
    // Ensure balance_type column exists for backend logic
    try { await queryInterface.addColumn('balance_snapshots', 'balance_type', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'farmer',
      comment: 'Type of balance (farmer, buyer, etc.)',
    }); } catch (e) {}
    try { await queryInterface.addColumn('balance_snapshots', 'previous_balance', {
      type: Sequelize.DECIMAL(16, 4),
      allowNull: false,
      defaultValue: 0.00,
    }); } catch (e) {}
    try { await queryInterface.addColumn('balance_snapshots', 'amount_change', {
      type: Sequelize.DECIMAL(16, 4),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Change in balance for this snapshot',
    }); } catch (e) {}
    try { await queryInterface.addColumn('balance_snapshots', 'new_balance', {
      type: Sequelize.DECIMAL(16, 4),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Balance after this transaction',
    }); } catch (e) {}
    try { await queryInterface.addColumn('balance_snapshots', 'transaction_type', {
      type: Sequelize.STRING(40),
      allowNull: false,
      comment: 'Nature of event (e.g. payment, adjustment, refund)',
    }); } catch (e) {}
    try { await queryInterface.addColumn('balance_snapshots', 'reference_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      comment: 'ID of related transaction or payment',
    }); } catch (e) {}
    try { await queryInterface.addColumn('balance_snapshots', 'reference_type', {
      type: Sequelize.STRING(40),
      allowNull: true,
      comment: 'Type of related entity (e.g. payment, transaction)',
    }); } catch (e) {}
    try { await queryInterface.addColumn('balance_snapshots', 'description', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Additional context or audit notes',
    }); } catch (e) {}
    // Add indexes for efficient querying (skip if already exists)
    try { await queryInterface.addIndex('balance_snapshots', ['user_id']); } catch (e) {}
    try { await queryInterface.addIndex('balance_snapshots', ['snapshot_date']); } catch (e) {}
    try { await queryInterface.addIndex('balance_snapshots', ['user_id', 'snapshot_date']); } catch (e) {}
    try { await queryInterface.addIndex('balance_snapshots', ['reference_id', 'reference_type']); } catch (e) {}
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the columns added in up
  await queryInterface.removeColumn('balance_snapshots', 'previous_balance');
  await queryInterface.removeColumn('balance_snapshots', 'amount_change');
  await queryInterface.removeColumn('balance_snapshots', 'new_balance');
  await queryInterface.removeColumn('balance_snapshots', 'transaction_type');
  await queryInterface.removeColumn('balance_snapshots', 'reference_id');
  await queryInterface.removeColumn('balance_snapshots', 'reference_type');
  await queryInterface.removeColumn('balance_snapshots', 'description');
    // Optionally, remove indexes if needed
    // await queryInterface.removeIndex('balance_snapshots', ['user_id']);
    // await queryInterface.removeIndex('balance_snapshots', ['snapshot_date']);
    // await queryInterface.removeIndex('balance_snapshots', ['user_id', 'snapshot_date']);
    // await queryInterface.removeIndex('balance_snapshots', ['reference_id', 'reference_type']);
  },
};
