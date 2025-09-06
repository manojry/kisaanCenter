import { User } from '../src/models/index';

export async function seedUsers() {
  await User.destroy({ where: {}, truncate: true, restartIdentity: true, cascade: true });
  await User.bulkCreate([
    {
      username: 'superadmin',
      password: 'superadminpass',
      role: 'superadmin',
      email: 'superadmin@kisaan.com',
      contact: '1234567890',
      status: 'active',
      created_by: null,
      owner_id: null,
      shop_id: null
    },
    {
      username: 'owner1',
      password: 'owner1pass',
      role: 'owner',
      email: 'owner1@kisaan.com',
      contact: '9876543210',
      status: 'active',
      created_by: 1,
      owner_id: null,
      shop_id: null
    },
    {
      username: 'farmer1',
      password: 'farmer1pass',
      role: 'farmer',
      email: 'farmer1@kisaan.com',
      contact: '9876543211',
      status: 'active',
      created_by: 2,
      owner_id: 'OWNER_001',
      shop_id: 1
    },
    {
      username: 'buyer1',
      password: 'buyer1pass',
      role: 'buyer',
      email: 'buyer1@kisaan.com',
      contact: '9876543212',
      status: 'active',
      created_by: 2,
      owner_id: 'OWNER_001',
      shop_id: 1
    }
  ]);
  console.log('Seeded users');
}
