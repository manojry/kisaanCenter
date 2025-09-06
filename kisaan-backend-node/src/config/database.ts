import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });


const isPostgres = (process.env.DB_DIALECT || 'postgres') === 'postgres';
const sslMode = process.env.DB_SSL_MODE || '';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'kisaan_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    dialect: (process.env.DB_DIALECT || 'postgres') as any,
    logging: false,
    ...(isPostgres && sslMode === 'require'
      ? {
          dialectOptions: {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          },
        }
      : {}),
  }
);

export default sequelize;
