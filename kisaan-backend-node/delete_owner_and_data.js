const { Pool } = require('pg');

const pool = new Pool({
  host: 'xxxxxx',
  database: 'kisaan_dev',
  user: 'postgres',
  password: 'xxxxxxxx',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function deleteOwnerAndRelatedData(ownerId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log(`🔍 Finding shop for owner_id=${ownerId}...`);
    const shopRes = await client.query('SELECT id FROM kisaan_shops WHERE owner_id = $1', [ownerId]);
    if (shopRes.rows.length === 0) {
      console.log('❌ No shop found for this owner. Continuing with owner deletion...');
      // Try to delete owner user anyway
      await client.query('DELETE FROM kisaan_users WHERE id = $1 AND role = \'owner\'', [ownerId]);
      console.log('🗑️ Deleted owner (if existed)');
      await client.query('COMMIT');
      console.log('✅ All related data deleted successfully (or nothing to delete).');
      return;
    }
    const shopId = shopRes.rows[0].id;
    console.log(`🛒 Shop ID: ${shopId}`);

    // Delete commissions
    await client.query('DELETE FROM kisaan_commissions WHERE shop_id = $1', [shopId]);
    console.log('🗑️ Deleted commissions');

    // Find all buyers and farmers for this shop
    const usersRes = await client.query('SELECT id FROM kisaan_users WHERE shop_id = $1', [shopId]);
    const userIds = usersRes.rows.map(u => u.id);

    if (userIds.length > 0) {
      // Find all transaction IDs for this shop
      const txRes = await client.query('SELECT id FROM kisaan_transactions WHERE shop_id = $1', [shopId]);
      const txIds = txRes.rows.map(t => t.id);
      if (txIds.length > 0) {
        // Delete payments linked to these transactions
        await client.query('DELETE FROM kisaan_payments WHERE transaction_id = ANY($1)', [txIds]);
        console.log('🗑️ Deleted payments linked to transactions');
      }
      // Delete transactions for this shop
      await client.query('DELETE FROM kisaan_transactions WHERE shop_id = $1', [shopId]);
      console.log('🗑️ Deleted transactions for shop');
      // Delete payments where counterparty_id matches any user in the shop or shop_id matches
      await client.query('DELETE FROM kisaan_payments WHERE counterparty_id = ANY($1) OR shop_id = $2', [userIds, shopId]);
      console.log('🗑️ Deleted payments for buyers/farmers and shop');
      // Delete users (buyers/farmers)
      await client.query('DELETE FROM kisaan_users WHERE id = ANY($1) AND role IN (\'buyer\', \'farmer\')', [userIds]);
      console.log('🗑️ Deleted buyers and farmers');
    }

  // Delete shop-product mappings
  await client.query('DELETE FROM kisaan_shop_products WHERE shop_id = $1', [shopId]);
  console.log('🗑️ Deleted shop-product mappings');
  // Delete shop
  await client.query('DELETE FROM kisaan_shops WHERE id = $1', [shopId]);
  console.log('🗑️ Deleted shop');

    // Delete owner user
    await client.query('DELETE FROM kisaan_users WHERE id = $1 AND role = \'owner\'', [ownerId]);
    console.log('🗑️ Deleted owner');

    await client.query('COMMIT');
    console.log('✅ All related data deleted successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error deleting owner and related data:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Usage: node delete_owner_and_data.js <owner_id>
const ownerId = process.argv[2];
if (!ownerId) {
  console.error('Usage: node delete_owner_and_data.js <owner_id>');
  process.exit(1);
}
deleteOwnerAndRelatedData(ownerId);
