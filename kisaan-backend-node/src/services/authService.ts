import { User } from '../models/user';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { LoginInput } from '../schemas/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export async function loginUser({ username, password }: LoginInput) {
  const user = await User.findOne({ where: { username } });
  if (!user) throw { status: 401, message: 'Invalid username or password' };
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw { status: 401, message: 'Invalid username or password' };
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
  return { token, user: { id: user.id, username: user.username, role: user.role } };
}
