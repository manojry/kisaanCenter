import { QueryInterface } from 'sequelize';

// Migration: Align kisaan_transactions schema with model definitions
// Adds missing financial and reference columns if they do not exist.
// Safe to run multiple times (idempotent guards per column).

export async function up(queryInterface: QueryInterface) {
  // Helper to add column if missing
  async function ensureColumn(table: string, column: string, definition: string) {
    const [results]: any = await queryInterface.sequelize.query(`SELECT column_name FROM information_schema.columns WHERE table_name='${table}' AND column_name='${column}'`);
    const exists = Array.isArray(results) && results.some((r: any) => r.column_name === column);
    if (!exists) {
      console.log(`[migration] Adding ${column} to ${table}`);
      await queryInterface.sequelize.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }

  // Ensure core transaction monetary columns
  await ensureColumn('kisaan_transactions', 'total_amount', 'DECIMAL(12,2) NOT NULL DEFAULT 0');
  await ensureColumn('kisaan_transactions', 'commission_amount', 'DECIMAL(12,2) NOT NULL DEFAULT 0');
  await ensureColumn('kisaan_transactions', 'farmer_earning', 'DECIMAL(12,2) NOT NULL DEFAULT 0');
  await ensureColumn('kisaan_transactions', 'commission_rate', 'DECIMAL(6,4)');
  await ensureColumn('kisaan_transactions', 'product_id', 'BIGINT');
  await ensureColumn('kisaan_transactions', 'commission_type', "VARCHAR(30)");
  await ensureColumn('kisaan_transactions', 'status', "VARCHAR(20)");
  await ensureColumn('kisaan_transactions', 'transaction_date', 'TIMESTAMP');
  await ensureColumn('kisaan_transactions', 'settlement_date', 'TIMESTAMP');
  await ensureColumn('kisaan_transactions', 'notes', 'TEXT');
  await ensureColumn('kisaan_transactions', 'metadata', 'JSONB');

  // Indexes (ignore errors if already exist)
  await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS idx_kisaan_transactions_product_id ON kisaan_transactions(product_id)');
  await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS idx_kisaan_transactions_created_at ON kisaan_transactions(created_at)');
}

export async function down() {
  // Irreversible (no-op) – intentionally empty because columns may be in active use.
  console.log('[migration] 20250925_align_transactions_columns down() no-op');
}