'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('kisaan_users', 'firstname', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'username' // optional, for column order
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('kisaan_users', 'firstname');
  }
};
