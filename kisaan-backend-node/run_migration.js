const fs = require('fs');
const path = require('path');

// Simple migration runner
console.log('🔄 Running transaction fields migration...');

const migrationSQL = fs.readFileSync(path.join(__dirname, 'migrations', 'add_transaction_fields.sql'), 'utf8');

console.log('📄 Migration SQL:');
console.log(migrationSQL);

console.log('\n✅ Migration ready to run!');
console.log('\nTo apply this migration:');
console.log('1. Connect to your database');
console.log('2. Run the SQL commands above');
console.log('3. Restart the backend server');

console.log('\nOr if using MySQL command line:');
console.log('mysql -u your_username -p your_database < migrations/add_transaction_fields.sql');