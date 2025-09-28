#!/usr/bin/env node

/**
 * KisaanCenter Schema Manager
 * A utility to manage database schema operations
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

class SchemaManager {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL_MODE === 'require' ? { rejectUnauthorized: false } : false
    });
    
    this.schemaDir = path.join(__dirname);
  }

  /**
   * Execute SQL file
   */
  async executeFile(filePath) {
    try {
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`Executing: ${path.basename(filePath)}`);
      
      const client = await this.pool.connect();
      try {
        await client.query(sql);
        console.log(`✅ Successfully executed: ${path.basename(filePath)}`);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`❌ Error executing ${path.basename(filePath)}:`, error.message);
      throw error;
    }
  }

  /**
   * Initialize complete schema
   */
  async initializeSchema() {
    console.log('🚀 Initializing KisaanCenter Database Schema...\n');
    
    try {
      // Execute main schema
      await this.executeFile(path.join(this.schemaDir, 'complete-schema.sql'));
      
      // Execute indexes
      await this.executeFile(path.join(this.schemaDir, 'indexes.sql'));
      
      // Execute any extensions
      const extensionsDir = path.join(this.schemaDir, 'extensions');
      if (fs.existsSync(extensionsDir)) {
        const extensionFiles = fs.readdirSync(extensionsDir)
          .filter(file => file.endsWith('.sql'))
          .sort();
        
        for (const file of extensionFiles) {
          await this.executeFile(path.join(extensionsDir, file));
        }
      }
      
      console.log('\n✅ Schema initialization completed successfully!');
      
    } catch (error) {
      console.error('\n❌ Schema initialization failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Validate schema against current database
   */
  async validateSchema() {
    console.log('🔍 Validating schema...\n');
    
    try {
      const client = await this.pool.connect();
      
      // Check all required tables exist
      const tables = [
        'kisaan_plans', 'kisaan_categories', 'kisaan_users', 'kisaan_shops',
        'kisaan_products', 'kisaan_transactions', 'kisaan_payments',
        'kisaan_commissions', 'kisaan_shop_categories', 'kisaan_shop_products',
        'kisaan_credits', 'kisaan_settlements', 'kisaan_payment_allocations',
        'kisaan_balance_snapshots', 'kisaan_plan_usage', 'kisaan_audit_logs'
      ];
      
      for (const table of tables) {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = $1
          )
        `, [table]);
        
        if (result.rows[0].exists) {
          console.log(`✅ Table exists: ${table}`);
        } else {
          console.log(`❌ Missing table: ${table}`);
        }
      }
      
      // Check enum types
      const enums = [
        'enum_kisaan_users_role', 'enum_kisaan_users_status', 'enum_kisaan_shops_status',
        'enum_kisaan_payments_payer_type', 'enum_kisaan_payments_payee_type',
        'enum_kisaan_payments_status', 'enum_kisaan_payments_method',
        'enum_kisaan_commissions_type', 'enum_kisaan_credits_status',
        'enum_kisaan_settlements_reason', 'enum_kisaan_settlements_status',
        'enum_kisaan_plans_billing_cycle'
      ];
      
      for (const enumType of enums) {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM pg_type 
            WHERE typname = $1
          )
        `, [enumType]);
        
        if (result.rows[0].exists) {
          console.log(`✅ Enum exists: ${enumType}`);
        } else {
          console.log(`❌ Missing enum: ${enumType}`);
        }
      }
      
      client.release();
      console.log('\n✅ Schema validation completed!');
      
    } catch (error) {
      console.error('\n❌ Schema validation failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Reset schema (DANGER: Drops all tables)
   */
  async resetSchema() {
    console.log('⚠️  WARNING: This will drop all tables and data!');
    console.log('🔄 Resetting schema...\n');
    
    try {
      // Safety guard: require explicit ALLOW_SCHEMA_RESET flag unless in test
      if (!process.env.ALLOW_SCHEMA_RESET && process.env.NODE_ENV !== 'test') {
        console.error('❌ Refusing to reset schema: set ALLOW_SCHEMA_RESET=true to allow (non-test env).');
        process.exit(2);
      }
      const client = await this.pool.connect();
      
      // Drop all tables in reverse dependency order
      const dropSQL = `
        DROP TABLE IF EXISTS "SequelizeMeta" CASCADE;
        DROP TABLE IF EXISTS kisaan_audit_logs CASCADE;
        DROP TABLE IF EXISTS kisaan_plan_usage CASCADE;
  DROP TABLE IF EXISTS kisaan_balance_snapshots CASCADE;
  DROP TABLE IF EXISTS kisaan_payment_allocations CASCADE;
        DROP TABLE IF EXISTS kisaan_settlements CASCADE;
        DROP TABLE IF EXISTS kisaan_credits CASCADE;
        DROP TABLE IF EXISTS kisaan_shop_products CASCADE;
        DROP TABLE IF EXISTS kisaan_shop_categories CASCADE;
        DROP TABLE IF EXISTS kisaan_commissions CASCADE;
        DROP TABLE IF EXISTS kisaan_payments CASCADE;
        DROP TABLE IF EXISTS kisaan_transactions CASCADE;
        DROP TABLE IF EXISTS kisaan_products CASCADE;
        DROP TABLE IF EXISTS kisaan_shops CASCADE;
        DROP TABLE IF EXISTS kisaan_users CASCADE;
        DROP TABLE IF EXISTS kisaan_categories CASCADE;
        DROP TABLE IF EXISTS kisaan_plans CASCADE;
        
        -- Drop sequences
        DROP SEQUENCE IF EXISTS kisaan_plans_id_seq CASCADE;
        DROP SEQUENCE IF EXISTS kisaan_categories_id_seq CASCADE;
        DROP SEQUENCE IF EXISTS kisaan_users_id_seq CASCADE;
        DROP SEQUENCE IF EXISTS kisaan_shops_id_seq CASCADE;
        DROP SEQUENCE IF EXISTS kisaan_products_id_seq CASCADE;
        DROP SEQUENCE IF EXISTS kisaan_transactions_id_seq CASCADE;
        DROP SEQUENCE IF EXISTS kisaan_payments_id_seq CASCADE;
        DROP SEQUENCE IF EXISTS kisaan_commissions_id_seq CASCADE;
        DROP SEQUENCE IF EXISTS kisaan_shop_categories_id_seq CASCADE;
        DROP SEQUENCE IF EXISTS kisaan_shop_products_id_seq CASCADE;
        DROP SEQUENCE IF EXISTS kisaan_credits_id_seq CASCADE;
        DROP SEQUENCE IF EXISTS kisaan_plan_usage_id_seq CASCADE;
        DROP SEQUENCE IF EXISTS kisaan_audit_logs_id_seq CASCADE;
  DROP SEQUENCE IF EXISTS payment_allocations_id_seq CASCADE;
        DROP SEQUENCE IF EXISTS kisaan_settlements_id_seq CASCADE;
  DROP SEQUENCE IF EXISTS balance_snapshots_id_seq CASCADE;
        
        -- Drop enum types
        DROP TYPE IF EXISTS enum_kisaan_users_role CASCADE;
        DROP TYPE IF EXISTS enum_kisaan_users_status CASCADE;
        DROP TYPE IF EXISTS enum_kisaan_shops_status CASCADE;
        DROP TYPE IF EXISTS enum_kisaan_payments_payer_type CASCADE;
        DROP TYPE IF EXISTS enum_kisaan_payments_payee_type CASCADE;
        DROP TYPE IF EXISTS enum_kisaan_payments_status CASCADE;
        DROP TYPE IF EXISTS enum_kisaan_payments_method CASCADE;
        DROP TYPE IF EXISTS enum_kisaan_commissions_type CASCADE;
        DROP TYPE IF EXISTS enum_kisaan_credits_status CASCADE;
        DROP TYPE IF EXISTS enum_kisaan_settlements_reason CASCADE;
        DROP TYPE IF EXISTS enum_kisaan_settlements_status CASCADE;
        DROP TYPE IF EXISTS enum_kisaan_plans_billing_cycle CASCADE;
      `;
      
      await client.query(dropSQL);
      client.release();
      
      console.log('✅ Schema reset completed!\n');
      
      // Reinitialize
      await this.initializeSchema();
      
    } catch (error) {
      console.error('\n❌ Schema reset failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Prepare schema (idempotent create of any missing objects)
   * Safe to run on production during first deploy or CI.
   */
  async prepareSchema() {
    console.log('🛠  Preparing schema (idempotent)...');
    try {
      // Quick existence check for a sentinel table to give user feedback
      const client = await this.pool.connect();
      const sentinel = await client.query(`SELECT to_regclass('public.kisaan_transactions') as exists;`);
      const exists = sentinel.rows[0].exists !== null;
      if (exists) {
        console.log('ℹ️  Core tables already exist – ensuring any new objects are created.');
      } else {
        console.log('ℹ️  Core tables not found – running full initialization.');
      }
      client.release();
      await this.initializeSchema();
      console.log('✅ Schema prepare complete');
    } catch (error) {
      console.error('❌ Schema prepare failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Close database connection
   */
  async close() {
    await this.pool.end();
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2];
  const manager = new SchemaManager();

  try {
    switch (command) {
      case 'init':
        await manager.initializeSchema();
        break;
      case 'validate':
        await manager.validateSchema();
        break;
      case 'reset':
        await manager.resetSchema();
        break;
      case 'prepare':
        await manager.prepareSchema();
        break;
      default:
        console.log(`
KisaanCenter Schema Manager

Usage:
  node schema-manager.js <command>

Commands:
  init      Initialize the complete schema
  validate  Validate current schema
  reset     Reset and reinitialize schema (DANGER: Drops all data)
  prepare   Create any missing tables/enums/sequences (idempotent safe)

Examples:
  node schema-manager.js init
  node schema-manager.js validate
  node schema-manager.js reset
        `);
    }
  } catch (error) {
    console.error('Command failed:', error.message);
    process.exit(1);
  } finally {
    await manager.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = SchemaManager;