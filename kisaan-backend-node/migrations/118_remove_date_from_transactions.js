module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove the obsolete 'date' column from kisaan_transactions
    await queryInterface.removeColumn("kisaan_transactions", "date");
  },
  down: async (queryInterface, Sequelize) => {
    // Re-add the 'date' column if needed (as DATEONLY, not null)
    await queryInterface.addColumn("kisaan_transactions", "date", {
      type: Sequelize.DATEONLY,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_DATE'),
    });
  },
};