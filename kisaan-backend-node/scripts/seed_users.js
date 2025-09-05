require('dotenv').config();
const bcrypt = require('bcryptjs');
const { User } = require('../src/models/user');
const sequelize = require('../src/config/database').default;

async function seedUsers() {
  await sequelize.authenticate();
  await sequelize.sync();

  const ownerId = 'OWN123';
  const users = [
    {
      username: 'superadmin',
      password: await bcrypt.hash('superadminpass', 10),
      role: 'superadmin',
      status: 'active',
    },
    {
      username: ownerId,
      password: await bcrypt.hash('ownerpass', 10),
      role: 'owner',
      status: 'active',
      owner_id: null,
    },
    {
      username: `ram_${ownerId}`,
      password: await bcrypt.hash('farmerpass', 10),
      role: 'farmer',
      status: 'active',
      owner_id: ownerId,
    },
    {
      username: `shyam_${ownerId}`,
      password: await bcrypt.hash('buyerpass', 10),
      role: 'buyer',
      status: 'active',
      owner_id: ownerId,
    },
  ];

  for (const user of users) {
    await User.create(user);
  }

  console.log('Seed users inserted.');
  process.exit(0);
}

seedUsers().catch((err) => {
  console.error(err);
  process.exit(1);
});
