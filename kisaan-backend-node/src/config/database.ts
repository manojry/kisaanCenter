import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbDialect = process.env.DB_DIALECT || 'sqlite';
const dbName = process.env.DB_NAME || 'kisaan_dev.db';
const dbUser = process.env.DB_USER || '';
const dbPassword = process.env.DB_PASSWORD || '';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '5432');
const sslMode = process.env.DB_SSL_MODE || '';

console.log('[DB CONFIG]', {
  DB_HOST: dbHost,
  DB_NAME: dbName,
  DB_USER: dbUser,
  DB_PASSWORD: dbPassword ? '***' : '',
  DB_PORT: dbPort,
  DB_DIALECT: dbDialect,
  DB_SSL_MODE: sslMode,
});

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: dbDialect as any,
  logging: false,
  ...(sslMode === 'require'
    ? {
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        },
      }
    : {}),
});

export default sequelize;
