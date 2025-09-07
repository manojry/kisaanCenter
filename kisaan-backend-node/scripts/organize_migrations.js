const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '../migrations');
const backupDir = path.join(__dirname, '../migrations_backup');

async function organizeMigrations() {
  console.log('🗂️ Organizing migrations...');
  
  // Create organized structure
  const organizedDir = path.join(__dirname, '../migrations_organized');
  
  if (!fs.existsSync(organizedDir)) {
    fs.mkdirSync(organizedDir);
  }
  
  // Create subdirectories
  const subdirs = [
    '000-099_core_schema',
    '100-199_user_management', 
    '200-299_transactions',
    '300-399_settlements',
    '400-499_reports',
    '500-599_products',
    '900-999_maintenance'
  ];
  
  subdirs.forEach(dir => {
    const fullPath = path.join(organizedDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath);
    }
  });
  
  console.log('📁 Created organized directory structure');
  
  // Migration mapping rules
  const migrationRules = {
    '000_comprehensive_kisaan_schema.js': '000-099_core_schema',
    '002_add_settlements_table.js': '300-399_settlements',
    // Add more rules as needed
  };
  
  // Copy current migrations to organized structure
  const files = fs.readdirSync(migrationsDir);
  
  files.forEach(file => {
    if (file.endsWith('.js')) {
      const targetDir = migrationRules[file] || '900-999_maintenance';
      const sourcePath = path.join(migrationsDir, file);
      const targetPath = path.join(organizedDir, targetDir, file);
      
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`📄 Moved ${file} to ${targetDir}`);
    }
  });
  
  // Create migration index
  const indexContent = `# Migration Index

## Current Active Migrations
- 000_comprehensive_kisaan_schema.js (Base schema)
- 002_add_settlements_table.js (Settlements feature)

## Backup Migrations (Legacy)
All old migrations are in migrations_backup/ directory.

## Organization Structure
- 000-099: Core schema and base tables
- 100-199: User management features  
- 200-299: Transaction features
- 300-399: Settlement features
- 400-499: Reporting features
- 500-599: Product management
- 900-999: Maintenance and fixes

## Usage
Only run migrations from the main migrations/ directory.
Organized migrations are for reference and future planning.
`;
  
  fs.writeFileSync(path.join(organizedDir, 'README.md'), indexContent);
  
  console.log('✅ Migration organization complete!');
  console.log('📋 Check migrations_organized/ directory for structured view');
}

organizeMigrations().catch(console.error);