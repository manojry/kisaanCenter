#!/usr/bin/env node

/**
 * Production Database Deployment Script
 * Safe deployment of KisaanCenter schema to production database
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const readline = require('readline');

// Load production environment
require('dotenv').config({ path: path.join(__dirname, '.env.production') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class ProductionDeployer {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL_MODE === 'require' ? { rejectUnauthorized: false } : false
    });
  }

  async confirmDeployment() {
    console.log('🚀 KisaanCenter Production Database Deployment');
    console.log('===============================================\n');
    
    console.log('📋 Target Database Configuration:');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   User: ${process.env.DB_USER}`);
    console.log(`   SSL: ${process.env.DB_SSL_MODE || 'disabled'}\n`);
    
    return new Promise((resolve) => {
      rl.question('⚠️  This will create/modify tables in PRODUCTION. Continue? (yes/no): ', (answer) => {
        resolve(answer.toLowerCase() === 'yes');
      });
    });
  }

  async testConnection() {
    console.log('🔍 Testing database connection...');
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log('✅ Database connection successful\n');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  }

  async checkExistingData() {
    console.log('🔍 Checking for existing data...');
    try {
      const client = await this.pool.connect();
      
      // Check if critical tables exist and have data
      const tables = ['kisaan_users', 'kisaan_shops', 'kisaan_transactions'];
      const existingData = {};
      
      for (const table of tables) {
        try {
          const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
          existingData[table] = parseInt(result.rows[0].count);
        } catch (error) {
          existingData[table] = 'table_not_exists';
        }
      }
      
      client.release();
      
      console.log('📊 Current data status:');
      Object.entries(existingData).forEach(([table, count]) => {
        if (count === 'table_not_exists') {
          console.log(`   ${table}: Table does not exist`);
        } else {
          console.log(`   ${table}: ${count} records`);
        }
      });
      console.log('');
      
      return existingData;
    } catch (error) {
      console.log('ℹ️  Could not check existing data (new database)\n');
      return {};
    }
  }

  async deploySchema() {
    console.log('🚀 Deploying schema...\n');
    
    try {
      // Execute schema files in order
      const schemaFiles = [
        'schema/complete-schema.sql',
        'schema/indexes.sql'
      ];
      
      for (const file of schemaFiles) {
        if (fs.existsSync(file)) {
          await this.executeFile(file);
        }
      }
      
      // Execute extensions if they exist
      const extensionsDir = 'schema/extensions';
      if (fs.existsSync(extensionsDir)) {
        const extensionFiles = fs.readdirSync(extensionsDir)
          .filter(file => file.endsWith('.sql'))
          .sort();
        
        for (const file of extensionFiles) {
          await this.executeFile(path.join(extensionsDir, file));
        }
      }
      
      console.log('\n✅ Schema deployment completed successfully!');
      
    } catch (error) {
      console.error('\n❌ Schema deployment failed:', error.message);
      throw error;
    }
  }

  async executeFile(filePath) {
    try {
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`📋 Executing: ${path.basename(filePath)}`);
      
      const client = await this.pool.connect();
      try {
        await client.query(sql);
        console.log(`   ✅ Success: ${path.basename(filePath)}`);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`   ❌ Error in ${path.basename(filePath)}:`, error.message);
      throw error;
    }
  }

  async seedInitialData() {
    console.log('\n🌱 Seeding initial data...');
    
    try {
      const client = await this.pool.connect();
      
      // Create superadmin user
      const superadminExists = await client.query(
        "SELECT id FROM kisaan_users WHERE username = 'superadmin'"
      );
      
      if (superadminExists.rows.length === 0) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('superadminpass', 12);
        
        await client.query(`
          INSERT INTO kisaan_users (username, password, email, role, created_at, updated_at)
          VALUES ('superadmin', $1, 'admin@kisaancenter.com', 'superadmin', NOW(), NOW())
        `, [hashedPassword]);
        
        console.log('   ✅ Created superadmin user');
      } else {
        console.log('   ℹ️  Superadmin user already exists');
      }
      
      // Create basic plans
      const basicPlanExists = await client.query(
        "SELECT id FROM kisaan_plans WHERE name = 'Basic'"
      );
      
      if (basicPlanExists.rows.length === 0) {
        await client.query(`
          INSERT INTO kisaan_plans (name, description, price, max_farmers, max_buyers, max_transactions, features, created_at, updated_at)
          VALUES 
          ('Basic', 'Basic plan for small shops', 99.00, 10, 50, 1000, '["basic_reporting", "customer_support"]', NOW(), NOW()),
          ('Premium', 'Premium plan for growing businesses', 199.00, 50, 200, 5000, '["advanced_reporting", "priority_support", "api_access"]', NOW(), NOW())
        `);
        
        console.log('   ✅ Created basic plans');
      } else {
        console.log('   ℹ️  Plans already exist');
      }
      
      // Create basic categories
      const categoryExists = await client.query(
        "SELECT id FROM kisaan_categories WHERE name = 'Flowers'"
      );
      
      if (categoryExists.rows.length === 0) {
        await client.query(`
          INSERT INTO kisaan_categories (name, description, created_at, updated_at)
          VALUES 
          ('Flowers', 'Fresh flowers and floral products', NOW(), NOW()),
          ('Fruits', 'Fresh fruits and seasonal produce', NOW(), NOW()),
          ('Vegetables', 'Fresh vegetables and greens', NOW(), NOW()),
          ('Grains', 'Grains and cereals', NOW(), NOW())
        `);
        
        console.log('   ✅ Created basic categories');
      } else {
        console.log('   ℹ️  Categories already exist');
      }
      
      client.release();
      console.log('✅ Initial data seeding completed\n');
      
    } catch (error) {
      console.error('❌ Error seeding initial data:', error.message);
      throw error;
    }
  }

  async validateDeployment() {
    console.log('🔍 Validating deployment...\n');
    
    try {
      const client = await this.pool.connect();
      
      // Check critical tables
      const tables = [
        'kisaan_users', 'kisaan_shops', 'kisaan_plans', 'kisaan_categories',
        'kisaan_products', 'kisaan_transactions', 'kisaan_payments'
      ];
      
      console.log('📋 Table validation:');
      for (const table of tables) {
        try {
          const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
          console.log(`   ✅ ${table}: ${result.rows[0].count} records`);
        } catch (error) {
          console.log(`   ❌ ${table}: Error - ${error.message}`);
        }
      }
      
      client.release();
      console.log('\n✅ Deployment validation completed\n');
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
    }
  }

  async close() {
    await this.pool.end();
    rl.close();
  }
}

// Main deployment process
async function deploy() {
  const deployer = new ProductionDeployer();
  
  try {
    // Confirm deployment
    const confirmed = await deployer.confirmDeployment();
    if (!confirmed) {
      console.log('❌ Deployment cancelled by user');
      process.exit(0);
    }
    
    // Test connection
    const connected = await deployer.testConnection();
    if (!connected) {
      process.exit(1);
    }
    
    // Check existing data
    await deployer.checkExistingData();
    
    // Deploy schema
    await deployer.deploySchema();
    
    // Seed initial data
    await deployer.seedInitialData();
    
    // Validate deployment
    await deployer.validateDeployment();
    
    console.log('🎉 Production deployment completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Update your frontend to point to this database');
    console.log('   2. Test the application thoroughly');
    console.log('   3. Set up database backups');
    console.log('   4. Monitor application logs');
    
  } catch (error) {
    console.error('\n💥 Deployment failed:', error.message);
    process.exit(1);
  } finally {
    await deployer.close();
  }
}

// Run deployment if called directly
if (require.main === module) {
  deploy();
}

module.exports = ProductionDeployer;