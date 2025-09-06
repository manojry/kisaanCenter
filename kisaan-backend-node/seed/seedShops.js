// Script to seed shops into the database
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Shop = require('../src/models/shop').default;
const sequelize = require('../src/config/database').default || require('../src/config/database');
const shops = require('./shops');

async function seedShops() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    for (const shop of shops) {
      await Shop.findOrCreate({ where: { name: shop.name, owner_id: shop.owner_id }, defaults: shop });
    }
    console.log('Shop seed data inserted successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding shops:', err);
    process.exit(1);
  }
}

seedShops();
