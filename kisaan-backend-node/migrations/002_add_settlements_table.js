const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if settlements table already exists
    const tableExists = await queryInterface.sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'settlements');"
    );
    
    if (tableExists[0][0].exists) {
      console.log('⚠️ Settlements table already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('settlements', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      shop_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'kisaan_shops',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      user_type: {
        type: DataTypes.ENUM('farmer', 'buyer'),
        allowNull: false,
      },
      transaction_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'kisaan_transactions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('overpayment', 'underpayment', 'settlement', 'expense'),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'settled'),
        defaultValue: 'pending',
      },
      settled_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      balance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      settlement_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    });

    // Add indexes
    await queryInterface.addIndex('settlements', ['shop_id']);
    await queryInterface.addIndex('settlements', ['user_id']);
    await queryInterface.addIndex('settlements', ['status']);
    await queryInterface.addIndex('settlements', ['shop_id', 'user_id']);

    console.log('✅ Settlements table created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('settlements');
  }
};