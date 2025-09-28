require('dotenv').config({ path: '.env' });
const { Client } = require('pg');
(async () => {
  const cfg = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL_MODE === 'require' ? { rejectUnauthorized: false } : undefined
  };
  console.log('[inspect] DB config host=%s db=%s ssl=%s', cfg.host, cfg.database, !!cfg.ssl);
  const c = new Client(cfg);
  await c.connect();
  for (const t of ['kisaan_commissions','kisaan_transactions']) {
    const sql = `SELECT column_name,is_nullable,column_default FROM information_schema.columns WHERE table_name='${t}' AND (column_name ILIKE '%created%' OR column_name ILIKE '%updated%') ORDER BY column_name;`;
    const r = await c.query(sql);
    console.log('\nTable', t);
    console.table(r.rows);
  }
  await c.end();
})().catch(e => { console.error(e); process.exit(1); });
