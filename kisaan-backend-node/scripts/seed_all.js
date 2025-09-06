// Generic seeder: runs all seed scripts in the 'scripts' and 'seed' folders
const fs = require('fs');
const path = require('path');


// Only scan the seed/ folder for seed scripts
const SEED_FOLDERS = [
  path.join(__dirname, '../seed'), // seed/
];

// Exclude this file and non-js files
const EXCLUDE = ['seed_all.js', 'seed_all.ts'];

async function runSeedScripts() {
  for (const folder of SEED_FOLDERS) {
    if (!fs.existsSync(folder)) continue;
    const files = fs.readdirSync(folder)
      .filter(f => f.endsWith('.js') && !EXCLUDE.includes(f));
    for (const file of files) {
      const fullPath = path.join(folder, file);
      console.log(`Running seed script: ${fullPath}`);
      try {
        // Each seed script should export a function or run on require
        require(fullPath);
      } catch (err) {
        console.error(`Error running ${file}:`, err);
        process.exit(1);
      }
    }
  }
}

runSeedScripts();
