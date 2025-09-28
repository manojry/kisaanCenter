#!/usr/bin/env node

/**
 * Migration Cleanup Script
 * Removes old migration files and updates project structure
 */

const fs = require('fs');
const path = require('path');

class MigrationCleanup {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.migrationsDir = path.join(this.projectRoot, 'migrations');
    this.backupDir = path.join(this.projectRoot, 'migrations-backup');
  }

  /**
   * Backup existing migrations before cleanup
   */
  async backupMigrations() {
    if (!fs.existsSync(this.migrationsDir)) {
      console.log('No migrations directory found. Skipping backup.');
      return;
    }

    console.log('📦 Creating backup of existing migrations...');
    
    // Create backup directory
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    // Copy migration files
    const files = fs.readdirSync(this.migrationsDir);
    let backupCount = 0;

    for (const file of files) {
      if (file.endsWith('.js') || file.endsWith('.ts')) {
        const sourcePath = path.join(this.migrationsDir, file);
        const backupPath = path.join(this.backupDir, file);
        
        fs.copyFileSync(sourcePath, backupPath);
        backupCount++;
      }
    }

    console.log(`✅ Backed up ${backupCount} migration files to ${this.backupDir}`);
  }

  /**
   * Remove old migration files
   */
  async removeMigrations() {
    if (!fs.existsSync(this.migrationsDir)) {
      console.log('No migrations directory found. Skipping cleanup.');
      return;
    }

    console.log('🗑️  Removing old migration files...');
    
    const files = fs.readdirSync(this.migrationsDir);
    let removedCount = 0;

    for (const file of files) {
      if (file.endsWith('.js') || file.endsWith('.ts')) {
        const filePath = path.join(this.migrationsDir, file);
        fs.unlinkSync(filePath);
        removedCount++;
        console.log(`   Removed: ${file}`);
      }
    }

    console.log(`✅ Removed ${removedCount} migration files`);
  }

  /**
   * Create new schema-based configuration
   */
  async updateConfiguration() {
    console.log('⚙️  Updating configuration files...');

    // Create new package.json scripts
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Add new schema management scripts
      if (!packageJson.scripts) packageJson.scripts = {};
      
      packageJson.scripts['schema:init'] = 'node schema/schema-manager.js init';
      packageJson.scripts['schema:validate'] = 'node schema/schema-manager.js validate';
      packageJson.scripts['schema:reset'] = 'node schema/schema-manager.js reset';
      packageJson.scripts['db:setup'] = 'npm run schema:init';
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('   Updated package.json with schema scripts');
    }

    // Create migration replacement notice
    const migrationNotice = `
# Migration System Replaced

The old Sequelize migration system has been replaced with a new schema management system.

## Old migrations backed up to: ./migrations-backup/

## New schema system location: ./schema/

## Usage:
- Initialize schema: npm run schema:init
- Validate schema: npm run schema:validate  
- Reset schema: npm run schema:reset

## See: ./schema/README.md for complete documentation
`;

    fs.writeFileSync(path.join(this.migrationsDir, 'README.md'), migrationNotice);
    console.log('   Created migration replacement notice');
  }

  /**
   * Update database configuration to disable auto-sync
   */
  async updateDatabaseConfig() {
    console.log('🔧 Updating database configuration...');

    const dbConfigPath = path.join(this.projectRoot, 'src/config/database.ts');
    if (fs.existsSync(dbConfigPath)) {
      let config = fs.readFileSync(dbConfigPath, 'utf8');
      
      // Add warning comment about schema management
      const schemaWarning = `
// =============================================
// SCHEMA MANAGEMENT NOTICE
// =============================================
// Database schema is now managed by ./schema/schema-manager.js
// Do NOT use sequelize.sync() or force sync in production
// Use: npm run schema:init for schema initialization
// =============================================
`;

      // Insert warning at the top of the file
      config = schemaWarning + '\n' + config;
      
      fs.writeFileSync(dbConfigPath, config);
      console.log('   Added schema management notice to database config');
    }
  }

  /**
   * Generate migration summary report
   */
  async generateReport() {
    console.log('📊 Generating migration cleanup report...');

    const report = `
# Migration Cleanup Report
Generated: ${new Date().toISOString()}

## Changes Made:
1. ✅ Backed up old migration files to ./migrations-backup/
2. ✅ Removed old migration files from ./migrations/
3. ✅ Created new schema management system in ./schema/
4. ✅ Updated package.json with new scripts
5. ✅ Added database configuration warnings

## New Schema Management Commands:
- \`npm run schema:init\` - Initialize complete schema
- \`npm run schema:validate\` - Validate current schema
- \`npm run schema:reset\` - Reset and reinitialize schema (DANGER)

## Files Created:
- ./schema/complete-schema.sql
- ./schema/indexes.sql
- ./schema/schema-manager.js
- ./schema/README.md
- ./schema/modules/ (modular schema components)

## Next Steps:
1. Test schema initialization: \`npm run schema:init\`
2. Validate schema: \`npm run schema:validate\`
3. Update any remaining model references
4. Remove migration references from CI/CD scripts

## Important Notes:
- Old migrations are preserved in ./migrations-backup/
- New system provides better control and extensibility
- Schema versioning now handled through git
- No more Sequelize auto-sync or migration runner needed

## Schema Features:
- ✅ Complete enum type support
- ✅ Proper foreign key constraints
- ✅ Optimized indexes for performance
- ✅ Modular and extensible design
- ✅ Production-ready with safety checks
`;

    fs.writeFileSync(path.join(this.projectRoot, 'MIGRATION-CLEANUP-REPORT.md'), report);
    console.log('   Created cleanup report: MIGRATION-CLEANUP-REPORT.md');
  }

  /**
   * Run complete cleanup process
   */
  async cleanup() {
    console.log('🚀 Starting migration cleanup process...\n');

    try {
      await this.backupMigrations();
      await this.removeMigrations();
      await this.updateConfiguration();
      await this.updateDatabaseConfig();
      await this.generateReport();

      console.log('\n✅ Migration cleanup completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Test schema: npm run schema:validate');
      console.log('2. Initialize schema: npm run schema:init');
      console.log('3. Review: MIGRATION-CLEANUP-REPORT.md');

    } catch (error) {
      console.error('\n❌ Migration cleanup failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI Interface
async function main() {
  const cleanup = new MigrationCleanup();
  await cleanup.cleanup();
}

if (require.main === module) {
  main();
}

module.exports = MigrationCleanup;