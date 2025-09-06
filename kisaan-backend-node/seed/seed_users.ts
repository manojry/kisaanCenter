
import { User } from '../src/models/index';
import { hashPassword } from './hash_util';


export async function seedUsers() {
  await User.destroy({ where: {}, truncate: true, restartIdentity: true, cascade: true });

  // Hash passwords for all users

  const users = [
    {
      username: 'superadmin',
      password: await hashPassword('superadminpass'),
      role: 'superadmin' as 'superadmin',
      email: 'superadmin@kisaan.com',
      contact: '1234567890',
      status: 'active' as 'active',
      created_by: null,
      owner_id: null,
      shop_id: null
    },
    {
      username: 'owner1',
      password: await hashPassword('owner1pass'),
      role: 'owner' as 'owner',
      email: 'owner1@kisaan.com',
      contact: '9876543210',
      status: 'active' as 'active',
      created_by: 1,
      owner_id: null,
      shop_id: null
    },
    {
      username: 'farmer1',
      password: await hashPassword('farmer1pass'),
      role: 'farmer' as 'farmer',
      email: 'farmer1@kisaan.com',
      contact: '9876543211',
      status: 'active' as 'active',
      created_by: 2,
      owner_id: 'OWNER_001',
      shop_id: 1
    },
    {
      username: 'buyer1',
      password: await hashPassword('buyer1pass'),
      role: 'buyer' as 'buyer',
      email: 'buyer1@kisaan.com',
      contact: '9876543212',
      status: 'active' as 'active',
      created_by: 2,
      owner_id: 'OWNER_001',
      shop_id: 1
    }
  ];

  await User.bulkCreate(users);
  console.log('Seeded users');
}
