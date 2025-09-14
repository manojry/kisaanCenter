const BalanceSnapshot = require('./src/models/balanceSnapshot').default;

async function syncBalanceSnapshot() {
  try {
    console.log('Syncing BalanceSnapshot model...');
    await BalanceSnapshot.sync({ force: true });
    console.log('✅ BalanceSnapshot table created/updated successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error syncing BalanceSnapshot:', err.message);
    process.exit(1);
  }
}

syncBalanceSnapshot();
