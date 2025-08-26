#!/usr/bin/env python3
"""
Database backup and maintenance utilities for KisaanCenter
Provides automated backup, cleanup, and maintenance operations
"""

import os
import sys
import subprocess
import logging
import argparse
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Optional

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from db.connection import config, db_manager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DatabaseBackupManager:
    """Database backup and maintenance operations"""
    
    def __init__(self):
        self.backup_dir = Path(os.getenv('BACKUP_LOCATION', './backups'))
        self.retention_days = int(os.getenv('BACKUP_RETENTION_DAYS', '30'))
        
        # Ensure backup directory exists
        self.backup_dir.mkdir(parents=True, exist_ok=True)

    def create_backup(self, backup_type: str = 'full') -> bool:
        """Create database backup"""
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_filename = f"kisaan_center_{backup_type}_{timestamp}.sql"
            backup_path = self.backup_dir / backup_filename
            
            logger.info(f"Creating {backup_type} backup: {backup_filename}")
            
            # Build pg_dump command
            cmd = [
                'pg_dump',
                '-h', config.DB_HOST,
                '-p', str(config.DB_PORT),
                '-U', config.DB_USER,
                '-d', config.DB_NAME,
                '--no-password',  # Use .pgpass or environment variable
                '--verbose',
                '--clean',
                '--create',
                '--format=custom' if backup_type == 'compressed' else '--format=plain'
            ]
            
            # Set environment variable for password
            env = os.environ.copy()
            env['PGPASSWORD'] = config.DB_PASSWORD
            
            # Execute backup
            if backup_type == 'compressed':
                backup_path = backup_path.with_suffix('.dump')
                cmd.extend(['-f', str(backup_path)])
            else:
                cmd.extend(['--file', str(backup_path)])
            
            result = subprocess.run(cmd, env=env, capture_output=True, text=True)
            
            if result.returncode == 0:
                # Compress plain backups
                if backup_type == 'full':
                    self._compress_backup(backup_path)
                
                logger.info(f"Backup created successfully: {backup_path}")
                return True
            else:
                logger.error(f"Backup failed: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"Backup creation failed: {str(e)}")
            return False

    def _compress_backup(self, backup_path: Path) -> bool:
        """Compress backup file"""
        try:
            compressed_path = backup_path.with_suffix('.sql.gz')
            cmd = ['gzip', str(backup_path)]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                logger.info(f"Backup compressed: {compressed_path}")
                return True
            else:
                logger.warning(f"Compression failed: {result.stderr}")
                return False
                
        except Exception as e:
            logger.warning(f"Compression error: {str(e)}")
            return False

    def restore_backup(self, backup_file: str, drop_existing: bool = False) -> bool:
        """Restore database from backup"""
        try:
            backup_path = self.backup_dir / backup_file
            
            if not backup_path.exists():
                logger.error(f"Backup file not found: {backup_path}")
                return False
            
            logger.info(f"Restoring from backup: {backup_file}")
            
            # Handle compressed files
            if backup_path.suffix == '.gz':
                cmd = ['gunzip', '-c', str(backup_path)]
                gunzip_process = subprocess.Popen(cmd, stdout=subprocess.PIPE)
                
                # Pipe to psql
                psql_cmd = [
                    'psql',
                    '-h', config.DB_HOST,
                    '-p', str(config.DB_PORT),
                    '-U', config.DB_USER,
                    '-d', config.DB_NAME
                ]
                
                env = os.environ.copy()
                env['PGPASSWORD'] = config.DB_PASSWORD
                
                result = subprocess.run(
                    psql_cmd, 
                    stdin=gunzip_process.stdout,
                    env=env,
                    capture_output=True,
                    text=True
                )
            else:
                # Regular SQL file or custom format
                if backup_path.suffix == '.dump':
                    cmd = [
                        'pg_restore',
                        '-h', config.DB_HOST,
                        '-p', str(config.DB_PORT),
                        '-U', config.DB_USER,
                        '-d', config.DB_NAME,
                        '--clean' if drop_existing else '--no-clean',
                        '--verbose',
                        str(backup_path)
                    ]
                else:
                    cmd = [
                        'psql',
                        '-h', config.DB_HOST,
                        '-p', str(config.DB_PORT),
                        '-U', config.DB_USER,
                        '-d', config.DB_NAME,
                        '-f', str(backup_path)
                    ]
                
                env = os.environ.copy()
                env['PGPASSWORD'] = config.DB_PASSWORD
                
                result = subprocess.run(cmd, env=env, capture_output=True, text=True)
            
            if result.returncode == 0:
                logger.info("Database restored successfully")
                return True
            else:
                logger.error(f"Restore failed: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"Restore failed: {str(e)}")
            return False

    def cleanup_old_backups(self) -> int:
        """Remove old backup files based on retention policy"""
        try:
            cutoff_date = datetime.now() - timedelta(days=self.retention_days)
            removed_count = 0
            
            logger.info(f"Cleaning up backups older than {self.retention_days} days")
            
            for backup_file in self.backup_dir.glob('kisaan_center_*'):
                if backup_file.is_file():
                    file_time = datetime.fromtimestamp(backup_file.stat().st_mtime)
                    
                    if file_time < cutoff_date:
                        backup_file.unlink()
                        logger.info(f"Removed old backup: {backup_file.name}")
                        removed_count += 1
            
            logger.info(f"Cleanup completed. Removed {removed_count} old backups")
            return removed_count
            
        except Exception as e:
            logger.error(f"Cleanup failed: {str(e)}")
            return 0

    def list_backups(self) -> List[dict]:
        """List available backup files"""
        backups = []
        
        try:
            for backup_file in sorted(self.backup_dir.glob('kisaan_center_*')):
                if backup_file.is_file():
                    stat = backup_file.stat()
                    backups.append({
                        'filename': backup_file.name,
                        'size_mb': round(stat.st_size / 1024 / 1024, 2),
                        'created': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                        'age_days': (datetime.now() - datetime.fromtimestamp(stat.st_mtime)).days
                    })
                    
        except Exception as e:
            logger.error(f"Error listing backups: {str(e)}")
            
        return backups

    def vacuum_analyze_database(self) -> bool:
        """Perform database maintenance operations"""
        try:
            logger.info("Performing database maintenance (VACUUM ANALYZE)")
            
            with db_manager.get_db_session() as session:
                # Note: VACUUM cannot be run inside a transaction
                session.execute("COMMIT")
                session.execute("VACUUM ANALYZE")
                
            logger.info("Database maintenance completed")
            return True
            
        except Exception as e:
            logger.error(f"Database maintenance failed: {str(e)}")
            return False

# CLI Command Functions
def backup_command(args):
    """Create database backup"""
    backup_manager = DatabaseBackupManager()
    
    backup_type = 'compressed' if args.compressed else 'full'
    success = backup_manager.create_backup(backup_type)
    
    if args.cleanup:
        backup_manager.cleanup_old_backups()
    
    return 0 if success else 1

def restore_command(args):
    """Restore database from backup"""
    backup_manager = DatabaseBackupManager()
    
    success = backup_manager.restore_backup(args.backup_file, args.drop_existing)
    return 0 if success else 1

def list_command(args):
    """List available backups"""
    backup_manager = DatabaseBackupManager()
    backups = backup_manager.list_backups()
    
    if not backups:
        print("No backups found")
        return 0
    
    print(f"{'Filename':<40} {'Size (MB)':<10} {'Created':<20} {'Age (days)':<12}")
    print("-" * 85)
    
    for backup in backups:
        print(f"{backup['filename']:<40} {backup['size_mb']:<10} {backup['created']:<20} {backup['age_days']:<12}")
    
    return 0

def cleanup_command(args):
    """Clean up old backup files"""
    backup_manager = DatabaseBackupManager()
    
    if not args.confirm:
        print(f"This will remove backup files older than {backup_manager.retention_days} days.")
        print("Use --confirm to proceed.")
        return 1
    
    removed_count = backup_manager.cleanup_old_backups()
    print(f"Removed {removed_count} old backup files")
    return 0

def maintenance_command(args):
    """Perform database maintenance"""
    backup_manager = DatabaseBackupManager()
    
    success = backup_manager.vacuum_analyze_database()
    
    if args.backup:
        logger.info("Creating maintenance backup...")
        backup_manager.create_backup('maintenance')
    
    return 0 if success else 1

def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description='KisaanCenter Database Backup & Maintenance Tool',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python backup_manager.py backup                    # Create full backup
  python backup_manager.py backup --compressed       # Create compressed backup
  python backup_manager.py list                      # List all backups
  python backup_manager.py restore backup_file.sql   # Restore from backup
  python backup_manager.py cleanup --confirm         # Remove old backups
  python backup_manager.py maintenance --backup      # Maintenance with backup
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Backup command
    backup_parser = subparsers.add_parser('backup', help='Create database backup')
    backup_parser.add_argument('--compressed', action='store_true', help='Create compressed backup')
    backup_parser.add_argument('--cleanup', action='store_true', help='Clean up old backups after creating new one')
    backup_parser.set_defaults(func=backup_command)
    
    # Restore command
    restore_parser = subparsers.add_parser('restore', help='Restore database from backup')
    restore_parser.add_argument('backup_file', help='Backup file name to restore from')
    restore_parser.add_argument('--drop-existing', action='store_true', help='Drop existing objects before restore')
    restore_parser.set_defaults(func=restore_command)
    
    # List command
    list_parser = subparsers.add_parser('list', help='List available backups')
    list_parser.set_defaults(func=list_command)
    
    # Cleanup command
    cleanup_parser = subparsers.add_parser('cleanup', help='Clean up old backup files')
    cleanup_parser.add_argument('--confirm', action='store_true', help='Confirm cleanup operation')
    cleanup_parser.set_defaults(func=cleanup_command)
    
    # Maintenance command
    maintenance_parser = subparsers.add_parser('maintenance', help='Perform database maintenance')
    maintenance_parser.add_argument('--backup', action='store_true', help='Create backup before maintenance')
    maintenance_parser.set_defaults(func=maintenance_command)
    
    # Parse and execute
    args = parser.parse_args()
    
    if not hasattr(args, 'func'):
        parser.print_help()
        return 1
    
    return args.func(args)

if __name__ == '__main__':
    sys.exit(main())
