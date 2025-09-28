import { User } from '../src/models/user';
import bcrypt from 'bcryptjs';

export async function seedSuperadmin() {
  const passwordHash = await bcrypt.hash('superadminpass', 10);
  await User.destroy({ where: { role: 'superadmin' } });
  await User.create({
    username: 'superadmin',
    password: passwordHash,
    role: 'superadmin',
    // Model currently defines: username, password, role, shop_id, email, balance, created_by
    email: 'superadmin@example.com',
    balance: 0,
  });
  console.log('Seeded superadmin user');
}

if (require.main === module) {
  seedSuperadmin().catch(console.error);
}
