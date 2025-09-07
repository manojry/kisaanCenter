'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // This is a comprehensive migration that creates the entire kisaan database schema
    // This replaces all previous migrations and ensures type consistency

    // ===============================================================
    // 1. CREATE ENUMS
    // ===============================================================
    
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        -- User role enum
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_kisaan_users_role') THEN
          CREATE TYPE enum_kisaan_users_role AS ENUM ('superadmin', 'owner', 'farmer', 'buyer');
        END IF;
        
        -- User status enum
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_kisaan_users_status') THEN
          CREATE TYPE enum_kisaan_users_status AS ENUM ('active', 'inactive');
        END IF;
        
        -- Shop status enum
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_kisaan_shops_status') THEN
          CREATE TYPE enum_kisaan_shops_status AS ENUM ('active', 'inactive', 'suspended');
        END IF;
        
        -- Plan status enum
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_kisaan_plans_status') THEN
          CREATE TYPE enum_kisaan_plans_status AS ENUM ('active', 'inactive');
        END IF;
        
        -- Category status enum
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_kisaan_categories_status') THEN
          CREATE TYPE enum_kisaan_categories_status AS ENUM ('active', 'inactive');
        END IF;
        
        -- Product record status enum
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_kisaan_products_record_status') THEN
          CREATE TYPE enum_kisaan_products_record_status AS ENUM ('active', 'inactive', 'deleted');
        END IF;
        
        -- Transaction type enum
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_kisaan_transactions_type') THEN
          CREATE TYPE enum_kisaan_transactions_type AS ENUM ('sale', 'purchase', 'return');
        END IF;
        
        -- Transaction status enum
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_kisaan_transactions_status') THEN
          CREATE TYPE enum_kisaan_transactions_status AS ENUM ('pending', 'paid', 'partial', 'credit', 'farmer_due');
        END IF;
        
        -- Transaction payment status enum
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_kisaan_transactions_payment_status') THEN
          CREATE TYPE enum_kisaan_transactions_payment_status AS ENUM ('pending', 'partial', 'paid');
        END IF;
        
        -- Transaction completion status enum
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_kisaan_transactions_completion_status') THEN
          CREATE TYPE enum_kisaan_transactions_completion_status AS ENUM ('incomplete', 'complete');
        END IF;
        
        -- Transaction record status enum
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_kisaan_transactions_record_status') THEN
          CREATE TYPE enum_kisaan_transactions_record_status AS ENUM ('active', 'inactive', 'deleted');
        END IF;
        
        -- Credit status enum
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_kisaan_credits_status') THEN
          CREATE TYPE enum_kisaan_credits_status AS ENUM ('outstanding', 'partially_paid', 'paid', 'overdue');
        END IF;
        
        -- Credit record status enum
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_kisaan_credits_record_status') THEN
          CREATE TYPE enum_kisaan_credits_record_status AS ENUM ('active', 'inactive', 'deleted');
        END IF;
        
        -- Payment method record status enum
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_kisaan_payment_methods_record_status') THEN
          CREATE TYPE enum_kisaan_payment_methods_record_status AS ENUM ('active', 'inactive');
        END IF;
        
        -- Payment type enum
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_kisaan_payments_type') THEN
          CREATE TYPE enum_kisaan_payments_type AS ENUM ('full', 'partial', 'advance', 'refund');
        END IF;
        
        -- Payment record status enum
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_kisaan_payments_record_status') THEN
          CREATE TYPE enum_kisaan_payments_record_status AS ENUM ('active', 'inactive', 'deleted');
        END IF;
        
        -- Payment payment type enum
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_kisaan_payments_payment_type') THEN
          CREATE TYPE enum_kisaan_payments_payment_type AS ENUM ('full', 'partial');
        END IF;
      END $$;
    `);

    // ===============================================================
    // 2. CREATE CORE TABLES
    // ===============================================================

    // Plans table
    await queryInterface.createTable('kisaan_plans', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      monthly_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      quarterly_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      yearly_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      max_farmers: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      max_buyers: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      max_transactions: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      data_retention_months: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 12
      },
      features: {
        type: Sequelize.JSON,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Categories table
    await queryInterface.createTable('kisaan_categories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Shops table
    await queryInterface.createTable('kisaan_shops', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      owner_id: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      address: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      contact: {
        type: Sequelize.STRING(15),
        allowNull: true
      },
      plan_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'kisaan_plans',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      commission_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 10.00
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'suspended'),
        allowNull: false,
        defaultValue: 'active'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Users table
    await queryInterface.createTable('kisaan_users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      username: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('superadmin', 'owner', 'farmer', 'buyer'),
        allowNull: false
      },
      owner_id: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      shop_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      contact: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Products table
    await queryInterface.createTable('kisaan_products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'kisaan_categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      shop_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'kisaan_shops',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      unit: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      record_status: {
        type: Sequelize.ENUM('active', 'inactive', 'deleted'),
        allowNull: false,
        defaultValue: 'active'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Transactions table
    await queryInterface.createTable('kisaan_transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      shop_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'kisaan_shops',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      farmer_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      buyer_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'kisaan_products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      total: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      parent_transaction_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'kisaan_transactions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      type: {
        type: Sequelize.ENUM('sale', 'purchase', 'return'),
        allowNull: false,
        defaultValue: 'sale'
      },
      status: {
        type: Sequelize.ENUM('pending', 'paid', 'partial', 'credit', 'farmer_due'),
        allowNull: false,
        defaultValue: 'pending'
      },
      commission_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0
      },
      commission_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0
      },
      payment_status: {
        type: Sequelize.ENUM('pending', 'partial', 'paid'),
        allowNull: false,
        defaultValue: 'pending'
      },
      buyer_paid: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0
      },
      farmer_paid: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0
      },
      deficit: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00
      },
      commission_confirmed: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      },
      completion_status: {
        type: Sequelize.ENUM('incomplete', 'complete'),
        allowNull: false,
        defaultValue: 'incomplete'
      },
      record_status: {
        type: Sequelize.ENUM('active', 'inactive', 'deleted'),
        allowNull: false,
        defaultValue: 'active'
      },
      transaction_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Credits table
    await queryInterface.createTable('kisaan_credits', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'kisaan_users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      shop_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'kisaan_shops',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      repaid_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('outstanding', 'partially_paid', 'paid', 'overdue'),
        allowNull: false,
        defaultValue: 'outstanding'
      },
      record_status: {
        type: Sequelize.ENUM('active', 'inactive', 'deleted'),
        allowNull: false,
        defaultValue: 'active'
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      issued_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Payment Methods table
    await queryInterface.createTable('kisaan_payment_methods', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      record_status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Payments table
    await queryInterface.createTable('kisaan_payments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      transaction_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'kisaan_transactions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      credit_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'kisaan_credits',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      payment_method_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'kisaan_payment_methods',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      type: {
        type: Sequelize.ENUM('full', 'partial', 'advance', 'refund'),
        allowNull: false
      },
      payment_type: {
        type: Sequelize.ENUM('full', 'partial'),
        allowNull: false,
        defaultValue: 'full'
      },
      payment_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      payer_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      payee_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      record_status: {
        type: Sequelize.ENUM('active', 'inactive', 'deleted'),
        allowNull: false,
        defaultValue: 'active'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Shop Categories junction table
    await queryInterface.createTable('kisaan_shop_categories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      shop_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'kisaan_shops',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'kisaan_categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // ===============================================================
    // 3. CREATE INDEXES
    // ===============================================================

    await queryInterface.addIndex('kisaan_shops', ['owner_id']);
    await queryInterface.addIndex('kisaan_shops', ['status']);
    await queryInterface.addIndex('kisaan_shops', ['plan_id']);

    await queryInterface.addIndex('kisaan_users', ['username']);
    await queryInterface.addIndex('kisaan_users', ['shop_id']);
    await queryInterface.addIndex('kisaan_users', ['role']);
    await queryInterface.addIndex('kisaan_users', ['owner_id']);

    await queryInterface.addIndex('kisaan_products', ['name']);
    await queryInterface.addIndex('kisaan_products', ['category_id']);
    await queryInterface.addIndex('kisaan_products', ['shop_id']);

    await queryInterface.addIndex('kisaan_transactions', ['shop_id']);
    await queryInterface.addIndex('kisaan_transactions', ['farmer_id']);
    await queryInterface.addIndex('kisaan_transactions', ['buyer_id']);
    await queryInterface.addIndex('kisaan_transactions', ['product_id']);
    await queryInterface.addIndex('kisaan_transactions', ['transaction_date']);
    await queryInterface.addIndex('kisaan_transactions', ['status']);
    await queryInterface.addIndex('kisaan_transactions', ['shop_id', 'farmer_id']);

    await queryInterface.addIndex('kisaan_credits', ['user_id']);
    await queryInterface.addIndex('kisaan_credits', ['shop_id']);

    await queryInterface.addIndex('kisaan_shop_categories', ['shop_id']);
    await queryInterface.addIndex('kisaan_shop_categories', ['category_id']);
    await queryInterface.addIndex('kisaan_shop_categories', ['shop_id', 'category_id'], { unique: true });
    await queryInterface.addIndex('kisaan_shop_categories', ['is_active']);

    await queryInterface.addIndex('kisaan_categories', ['name'], { unique: true });
    await queryInterface.addIndex('kisaan_plans', ['name'], { unique: true });
    await queryInterface.addIndex('kisaan_products', ['name', 'category_id'], { unique: true });

    console.log('✅ Comprehensive kisaan database schema created successfully!');
  },

  async down(queryInterface, Sequelize) {
    // Drop all tables in reverse dependency order
    await queryInterface.dropTable('kisaan_payments');
    await queryInterface.dropTable('kisaan_payment_methods');
    await queryInterface.dropTable('kisaan_credits');
    await queryInterface.dropTable('kisaan_shop_categories');
    await queryInterface.dropTable('kisaan_transactions');
    await queryInterface.dropTable('kisaan_products');
    await queryInterface.dropTable('kisaan_users');
    await queryInterface.dropTable('kisaan_shops');
    await queryInterface.dropTable('kisaan_categories');
    await queryInterface.dropTable('kisaan_plans');

    // Drop enums
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_kisaan_users_role CASCADE;
      DROP TYPE IF EXISTS enum_kisaan_users_status CASCADE;
      DROP TYPE IF EXISTS enum_kisaan_shops_status CASCADE;
      DROP TYPE IF EXISTS enum_kisaan_plans_status CASCADE;
      DROP TYPE IF EXISTS enum_kisaan_categories_status CASCADE;
      DROP TYPE IF EXISTS enum_kisaan_products_record_status CASCADE;
      DROP TYPE IF EXISTS enum_kisaan_transactions_type CASCADE;
      DROP TYPE IF EXISTS enum_kisaan_transactions_status CASCADE;
      DROP TYPE IF EXISTS enum_kisaan_transactions_payment_status CASCADE;
      DROP TYPE IF EXISTS enum_kisaan_transactions_completion_status CASCADE;
      DROP TYPE IF EXISTS enum_kisaan_transactions_record_status CASCADE;
      DROP TYPE IF EXISTS enum_kisaan_credits_status CASCADE;
      DROP TYPE IF EXISTS enum_kisaan_credits_record_status CASCADE;
      DROP TYPE IF EXISTS enum_kisaan_payment_methods_record_status CASCADE;
      DROP TYPE IF EXISTS enum_kisaan_payments_type CASCADE;
      DROP TYPE IF EXISTS enum_kisaan_payments_record_status CASCADE;
      DROP TYPE IF EXISTS enum_kisaan_payments_payment_type CASCADE;
    `);

    console.log('✅ All kisaan tables and enums dropped successfully!');
  }
};
