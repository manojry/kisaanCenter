import { User } from '../src/models/user';
import bcrypt from 'bcryptjs';

async function createSuperadmin() {
  const username = 'superadmin';
  const password = 'superadminpass';
  const hashed = await bcrypt.hash(password, 10);
  const [user, created] = await User.findOrCreate({
    where: { username },
    defaults: {
      username,
      password: hashed,
      role: 'superadmin',
      status: 'active',
    },
  });
  if (created) {
    console.log('✅ Superadmin user created:', username);
  } else {
    console.log('ℹ️  Superadmin user already exists:', username);
  }
  process.exit(0);
}

createSuperadmin().catch(e => {
  console.error('❌ Failed to create superadmin:', e);
  process.exit(1);
});
