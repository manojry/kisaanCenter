// Generic migration runner: runs all migration scripts in the 'migrations' folder in order
const fs = require('fs');
const path = require('path');

const MIGRATIONS_FOLDER = path.join(__dirname, '../migrations');

async function runMigrations() {
  if (!fs.existsSync(MIGRATIONS_FOLDER)) {
    console.log('No migrations folder found.');
    return;
  }
  // Get all .js migration files, sorted by filename (timestamp order)
  const files = fs.readdirSync(MIGRATIONS_FOLDER)
    .filter(f => f.endsWith('.js'))
    .sort();
  for (const file of files) {
    const fullPath = path.join(MIGRATIONS_FOLDER, file);
    console.log(`Running migration: ${fullPath}`);
    try {
      // Each migration should export an 'up' function
      const migration = require(fullPath);
      if (typeof migration.up === 'function') {
        await migration.up();
      } else {
        console.warn(`Migration ${file} does not export an 'up' function.`);
      }
    } catch (err) {
      console.error(`Error running migration ${file}:`, err);
      process.exit(1);
    }
  }
  console.log('All migrations completed.');
}

runMigrations();
