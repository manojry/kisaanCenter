// Migration: Enforce shop_id NOT NULL for owner, farmer, buyer roles
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add a check constraint to enforce shop_id is NOT NULL for owner, farmer, buyer
    await queryInterface.sequelize.query(`
      ALTER TABLE kisaan_users
      ADD CONSTRAINT shop_id_required_for_roles
      CHECK (
        (role IN ('owner', 'farmer', 'buyer') AND shop_id IS NOT NULL)
        OR (role = 'superadmin')
      );
    `);
    // Optionally, add a partial index for performance (not required for constraint)
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_kisaan_users_shopid_roles
      ON kisaan_users(shop_id)
      WHERE role IN ('owner', 'farmer', 'buyer');
    `);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE kisaan_users DROP CONSTRAINT IF EXISTS shop_id_required_for_roles;
    `);
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_kisaan_users_shopid_roles;
    `);
  }
};