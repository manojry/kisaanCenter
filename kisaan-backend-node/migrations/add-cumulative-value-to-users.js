"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('kisaan_users', 'cumulative_value', {
      type: Sequelize.DECIMAL(18,2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Cumulative value: total earned (farmer), total spent (buyer), total commission (owner)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('kisaan_users', 'cumulative_value');
  }
};
