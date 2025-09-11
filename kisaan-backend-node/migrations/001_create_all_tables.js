'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create Plans table
    await queryInterface.createTable('kisaan_plans', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      price: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      billing_cycle: { type: Sequelize.ENUM('monthly', 'quarterly', 'yearly'), allowNull: true, defaultValue: 'monthly' },
      monthly_price: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      quarterly_price: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      yearly_price: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      max_farmers: { type: Sequelize.INTEGER, allowNull: true },
      max_buyers: { type: Sequelize.INTEGER, allowNull: true },
      max_transactions: { type: Sequelize.INTEGER, allowNull: true },
      data_retention_months: { type: Sequelize.INTEGER, allowNull: true },
      features: { type: Sequelize.TEXT, allowNull: false, defaultValue: '[]' },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: true, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: true, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Create Categories table
    await queryInterface.createTable('kisaan_categories', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: true, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: true, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Create Users table
    await queryInterface.createTable('kisaan_users', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      username: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      role: { type: Sequelize.ENUM('superadmin', 'owner', 'farmer', 'buyer'), allowNull: false },
      shop_id: { type: Sequelize.BIGINT, allowNull: true },
      contact: { type: Sequelize.STRING, allowNull: true },
      email: { type: Sequelize.STRING, allowNull: true },
      status: { type: Sequelize.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
      balance: { type: Sequelize.DECIMAL(12,2), allowNull: false, defaultValue: 0.00 },
      cumulative_value: { type: Sequelize.DECIMAL(12,2), allowNull: false, defaultValue: 0.00 },
      created_by: { type: Sequelize.BIGINT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Create Shops table
    await queryInterface.createTable('kisaan_shops', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      owner_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: 'kisaan_users', key: 'id' } },
      plan_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'kisaan_plans', key: 'id' } },
      address: { type: Sequelize.TEXT, allowNull: true },
      contact: { type: Sequelize.STRING, allowNull: true },
      status: { type: Sequelize.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Create Products table
    await queryInterface.createTable('kisaan_products', {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: Sequelize.STRING(100), allowNull: false },
  category_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'kisaan_categories', key: 'id' } },
  description: { type: Sequelize.TEXT, allowNull: true },
  price: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
  record_status: { type: Sequelize.STRING, allowNull: true },
  unit: { type: Sequelize.STRING(20), allowNull: true },
  created_at: { type: Sequelize.DATE, allowNull: true, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  updated_at: { type: Sequelize.DATE, allowNull: true, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Create Transactions table
    await queryInterface.createTable('kisaan_transactions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      shop_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: 'kisaan_shops', key: 'id' } },
      farmer_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: 'kisaan_users', key: 'id' } },
      buyer_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: 'kisaan_users', key: 'id' } },
      category_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'kisaan_categories', key: 'id' } },
      product_name: { type: Sequelize.STRING(255), allowNull: false },
      quantity: { type: Sequelize.DECIMAL(12,2), allowNull: false },
      unit_price: { type: Sequelize.DECIMAL(12,2), allowNull: false },
      total_sale_value: { type: Sequelize.DECIMAL(12,2), allowNull: false },
      shop_commission: { type: Sequelize.DECIMAL(12,2), allowNull: false },
      farmer_earning: { type: Sequelize.DECIMAL(12,2), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Create Payments table
    await queryInterface.createTable('kisaan_payments', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      transaction_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'kisaan_transactions', key: 'id' } },
      payer_type: { type: Sequelize.ENUM('BUYER', 'SHOP'), allowNull: false },
      payee_type: { type: Sequelize.ENUM('SHOP', 'FARMER'), allowNull: false },
      amount: { type: Sequelize.DECIMAL(12,2), allowNull: false },
      status: { type: Sequelize.ENUM('PENDING', 'PAID', 'FAILED'), allowNull: false, defaultValue: 'PENDING' },
      payment_date: { type: Sequelize.DATE, allowNull: true },
      method: { type: Sequelize.ENUM('CASH', 'BANK', 'UPI', 'OTHER'), allowNull: false },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Create Commissions table
    await queryInterface.createTable('kisaan_commissions', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      shop_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: 'kisaan_shops', key: 'id' } },
      rate: { type: Sequelize.DECIMAL(5,2), allowNull: false },
      type: { type: Sequelize.ENUM('percentage', 'fixed'), allowNull: false, defaultValue: 'percentage' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Create Shop Categories junction table
    await queryInterface.createTable('kisaan_shop_categories', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      shop_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: 'kisaan_shops', key: 'id' } },
      category_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'kisaan_categories', key: 'id' } },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Create Shop Products junction table
    await queryInterface.createTable('kisaan_shop_products', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      shop_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: 'kisaan_shops', key: 'id' } },
      product_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'kisaan_products', key: 'id' } },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Add indexes (idempotent: remove if exists, then create)
    const safeAddIndex = async (table, fields, options = {}) => {
      let indexName;
      if (options.name) {
        indexName = options.name;
      } else if (Array.isArray(fields)) {
        indexName = `${table}_${fields.join('_')}`;
      } else {
        indexName = `${table}_${fields}`;
      }
      try {
        await queryInterface.removeIndex(table, indexName);
      } catch (e) {}
      await queryInterface.addIndex(table, fields, options);
    };

    await safeAddIndex('kisaan_users', ['username'], { unique: true });
    await safeAddIndex('kisaan_users', ['shop_id']);
    await safeAddIndex('kisaan_users', ['role']);
    await safeAddIndex('kisaan_shops', ['owner_id']);
    await safeAddIndex('kisaan_shops', ['plan_id']);
    await safeAddIndex('kisaan_shops', ['status']);
    await safeAddIndex('kisaan_products', ['category_id']);
    await safeAddIndex('kisaan_products', ['name', 'category_id'], { unique: true });
    await safeAddIndex('kisaan_transactions', ['shop_id']);
    await safeAddIndex('kisaan_transactions', ['farmer_id']);
    await safeAddIndex('kisaan_transactions', ['buyer_id']);
    await safeAddIndex('kisaan_transactions', ['category_id']);
    await safeAddIndex('kisaan_transactions', ['created_at']);
    await safeAddIndex('kisaan_payments', ['transaction_id']);
    await safeAddIndex('kisaan_payments', ['payer_type']);
    await safeAddIndex('kisaan_payments', ['payee_type']);
    await safeAddIndex('kisaan_payments', ['status']);
    await safeAddIndex('kisaan_payments', ['payment_date']);
    await safeAddIndex('kisaan_payments', ['transaction_id', 'status']);
    await safeAddIndex('kisaan_commissions', ['shop_id']);
    await safeAddIndex('kisaan_shop_categories', ['shop_id']);
    await safeAddIndex('kisaan_shop_categories', ['category_id']);
    await safeAddIndex('kisaan_shop_categories', ['shop_id', 'category_id'], { unique: true });
    await safeAddIndex('kisaan_shop_products', ['shop_id']);
    await safeAddIndex('kisaan_shop_products', ['product_id']);
    await safeAddIndex('kisaan_shop_products', ['shop_id', 'product_id'], { unique: true });

    console.log('✅ All tables created successfully!');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('kisaan_shop_products');
    await queryInterface.dropTable('kisaan_shop_categories');
    await queryInterface.dropTable('kisaan_commissions');
    await queryInterface.dropTable('kisaan_payments');
    await queryInterface.dropTable('kisaan_transactions');
    await queryInterface.dropTable('kisaan_products');
    await queryInterface.dropTable('kisaan_shops');
    await queryInterface.dropTable('kisaan_users');
    await queryInterface.dropTable('kisaan_categories');
    await queryInterface.dropTable('kisaan_plans');
  }
};