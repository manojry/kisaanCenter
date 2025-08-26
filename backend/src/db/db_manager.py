#!/usr/bin/env python3
"""
Database management CLI tool for KisaanCenter
Provides commands for database setup, migration, seeding, and maintenance
"""

import sys
import argparse
import logging
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from db.connection import db_manager, check_database_health
from db.init_db import db_initializer
from db.seeds.seed_data import db_seeder

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def setup_database(args):
    """Setup complete database"""
    try:
        logger.info("Setting up database...")
        
        # Initialize database
        success = db_initializer.initialize_database(
            create_db=args.create_db,
            create_tables=args.create_tables
        )
        
        if not success:
            logger.error("Database setup failed")
            return 1
            
        # Seed data if requested
        if args.seed_data:
            logger.info("Seeding database...")
            db_seeder.seed_all(include_test_data=args.include_test_data)
            
        logger.info("Database setup completed successfully")
        return 0
        
    except Exception as e:
        logger.error(f"Database setup failed: {str(e)}")
        return 1

def health_check(args):
    """Check database health"""
    try:
        health = check_database_health()
        
        print("=== Database Health Check ===")
        print(f"Database Status: {health.get('database', 'Unknown')}")
        print(f"Connection Pool: {health.get('connection_pool', {})}")
        print(f"Last Check: {health.get('last_check', 'Unknown')}")
        
        if 'error' in health:
            print(f"Error: {health['error']}")
            return 1
            
        return 0 if health.get('database') == 'healthy' else 1
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return 1

def database_info(args):
    """Get database information"""
    try:
        info = db_initializer.get_database_info()
        
        print("=== Database Information ===")
        print(f"Database: {info.get('database_name', 'Unknown')}")
        print(f"Total Tables: {info.get('total_tables', 0)}")
        
        if 'tables' in info:
            print("\nTables:")
            for table_name, table_info in info['tables'].items():
                print(f"  {table_name}: {table_info['columns']} columns, {table_info['indexes']} indexes")
                
        if 'connection_info' in info:
            conn_info = info['connection_info']
            print(f"\nConnection Pool:")
            if 'status' not in conn_info:
                print(f"  Size: {conn_info.get('pool_size', 'N/A')}")
                print(f"  Checked Out: {conn_info.get('checked_out', 'N/A')}")
                print(f"  Available: {conn_info.get('checked_in', 'N/A')}")
        
        return 0
        
    except Exception as e:
        logger.error(f"Failed to get database info: {str(e)}")
        return 1

def seed_data(args):
    """Seed database with data"""
    try:
        logger.info("Seeding database...")
        
        if args.reference_only:
            from db.seeds.seed_data import seed_reference_data
            success = seed_reference_data()
        else:
            success = db_seeder.seed_all(include_test_data=args.include_test_data)
            
        if success:
            summary = db_seeder.get_seed_summary()
            print("=== Seeding Summary ===")
            for obj_type, count in summary.items():
                print(f"{obj_type}: {count} records")
            logger.info("Database seeding completed")
            return 0
        else:
            logger.error("Database seeding failed")
            return 1
            
    except Exception as e:
        logger.error(f"Seeding failed: {str(e)}")
        return 1

def clear_data(args):
    """Clear seeded data"""
    if not args.confirm:
        print("This will clear all seeded data. Use --confirm to proceed.")
        return 1
        
    try:
        logger.warning("Clearing seeded data...")
        success = db_seeder.clear_all_data(confirm=True)
        
        if success:
            logger.info("Data cleared successfully")
            return 0
        else:
            logger.error("Failed to clear data")
            return 1
            
    except Exception as e:
        logger.error(f"Clear data failed: {str(e)}")
        return 1

def reset_database(args):
    """Reset entire database"""
    if not args.confirm:
        print("This will completely reset the database. Use --confirm to proceed.")
        return 1
        
    try:
        logger.warning("Resetting database...")
        success = db_initializer.reset_database(confirm=True)
        
        if success:
            logger.info("Database reset completed")
            return 0
        else:
            logger.error("Database reset failed")
            return 1
            
    except Exception as e:
        logger.error(f"Database reset failed: {str(e)}")
        return 1

def migrate_database(args):
    """Run database migrations"""
    try:
        import subprocess
        import os
        
        # Change to the migrations directory
        migrations_dir = Path(__file__).parent / 'migrations'
        os.chdir(migrations_dir)
        
        if args.action == 'init':
            # Initialize migrations
            cmd = ['alembic', 'init', '.']
        elif args.action == 'revision':
            # Create new migration
            cmd = ['alembic', 'revision', '--autogenerate']
            if args.message:
                cmd.extend(['-m', args.message])
        elif args.action == 'upgrade':
            # Run migrations
            cmd = ['alembic', 'upgrade', args.target or 'head']
        elif args.action == 'downgrade':
            # Rollback migrations
            cmd = ['alembic', 'downgrade', args.target or '-1']
        elif args.action == 'history':
            # Show migration history
            cmd = ['alembic', 'history']
        elif args.action == 'current':
            # Show current migration
            cmd = ['alembic', 'current']
        else:
            logger.error(f"Unknown migration action: {args.action}")
            return 1
            
        # Run alembic command
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(result.stdout)
            logger.info(f"Migration {args.action} completed successfully")
            return 0
        else:
            print(result.stderr)
            logger.error(f"Migration {args.action} failed")
            return 1
            
    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")
        return 1

def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description='KisaanCenter Database Management Tool',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python db_manager.py setup --seed-data            # Full setup with data
  python db_manager.py health                       # Check database health
  python db_manager.py info                         # Get database information
  python db_manager.py seed --include-test-data     # Seed with test data
  python db_manager.py migrate upgrade              # Run migrations
  python db_manager.py reset --confirm              # Reset database (DANGER)
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Setup command
    setup_parser = subparsers.add_parser('setup', help='Setup database')
    setup_parser.add_argument('--create-db', action='store_true', help='Create database if not exists')
    setup_parser.add_argument('--create-tables', action='store_true', default=True, help='Create tables')
    setup_parser.add_argument('--seed-data', action='store_true', help='Seed initial data')
    setup_parser.add_argument('--include-test-data', action='store_true', help='Include test/demo data')
    setup_parser.set_defaults(func=setup_database)
    
    # Health command
    health_parser = subparsers.add_parser('health', help='Check database health')
    health_parser.set_defaults(func=health_check)
    
    # Info command
    info_parser = subparsers.add_parser('info', help='Get database information')
    info_parser.set_defaults(func=database_info)
    
    # Seed command
    seed_parser = subparsers.add_parser('seed', help='Seed database with data')
    seed_parser.add_argument('--include-test-data', action='store_true', help='Include test/demo data')
    seed_parser.add_argument('--reference-only', action='store_true', help='Seed only reference data')
    seed_parser.set_defaults(func=seed_data)
    
    # Clear command
    clear_parser = subparsers.add_parser('clear', help='Clear seeded data')
    clear_parser.add_argument('--confirm', action='store_true', help='Confirm data clearing')
    clear_parser.set_defaults(func=clear_data)
    
    # Reset command
    reset_parser = subparsers.add_parser('reset', help='Reset entire database')
    reset_parser.add_argument('--confirm', action='store_true', help='Confirm database reset')
    reset_parser.set_defaults(func=reset_database)
    
    # Migrate command
    migrate_parser = subparsers.add_parser('migrate', help='Database migrations')
    migrate_parser.add_argument('action', choices=['init', 'revision', 'upgrade', 'downgrade', 'history', 'current'])
    migrate_parser.add_argument('--message', '-m', help='Migration message')
    migrate_parser.add_argument('--target', help='Migration target (revision ID or relative)')
    migrate_parser.set_defaults(func=migrate_database)
    
    # Parse and execute
    args = parser.parse_args()
    
    if not hasattr(args, 'func'):
        parser.print_help()
        return 1
        
    return args.func(args)

if __name__ == '__main__':
    sys.exit(main())
