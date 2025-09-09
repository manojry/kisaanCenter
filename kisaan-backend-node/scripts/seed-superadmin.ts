import { User } from '../src/models/user';
import bcrypt from 'bcryptjs';

export async function seedSuperadmin() {
  const passwordHash = await bcrypt.hash('superadminpass', 10);
  await User.destroy({ where: { role: 'superadmin' } });
  await User.create({
    username: 'superadmin',
    password: passwordHash,
    role: 'superadmin',
    status: 'active',
    balance: 0,
    cumulative_value: 0,
    contact: null,
    email: 'superadmin@example.com',
  });
  console.log('Seeded superadmin user');
}

if (require.main === module) {
  seedSuperadmin().catch(console.error);
}
