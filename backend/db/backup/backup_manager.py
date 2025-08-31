
import os
import subprocess
import gzip
import shutil
from datetime import datetime, timedelta
from typing import List
import logging

logger = logging.getLogger(__name__)

class BackupManager:
    def __init__(self, db_config: dict = None, backup_dir: str = "backups"):
        # Load db_config from environment variables if not provided
        if db_config is None:
            db_config = {
                'host': os.getenv('DB_HOST', 'localhost'),
                'port': int(os.getenv('DB_PORT', 5432)),
                'name': os.getenv('DB_NAME', 'postgres'),
                'user': os.getenv('DB_USER', 'postgres'),
                'password': os.getenv('DB_PASSWORD', ''),
                'sslmode': os.getenv('DB_SSLMODE', 'require')
            }
        self.db_config = db_config
        self.backup_dir = backup_dir
        self.ensure_backup_dir()
    
    def ensure_backup_dir(self):
        """Ensure backup directory exists"""
        os.makedirs(self.backup_dir, exist_ok=True)
    
    def create_backup(self, compress: bool = True) -> str:
        """Create database backup"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"kisaan_center_backup_{timestamp}.sql"
        backup_path = os.path.join(self.backup_dir, backup_filename)
        
        try:
            # Create pg_dump command
            cmd = [
                "pg_dump",
                f"--host={self.db_config['host']}",
                f"--port={self.db_config['port']}",
                f"--username={self.db_config['user']}",
                f"--dbname={self.db_config['name']}",
                "--no-password",
                "--verbose",
                "--clean",
                "--no-acl",
                "--no-owner",
                f"--file={backup_path}"
            ]
            
            # Set password via environment
            env = os.environ.copy()
            env['PGPASSWORD'] = self.db_config['password']
            
            # Execute backup
            result = subprocess.run(cmd, env=env, capture_output=True, text=True)
            
            if result.returncode != 0:
                raise Exception(f"pg_dump failed: {result.stderr}")
            
            # Compress if requested
            if compress:
                compressed_path = f"{backup_path}.gz"
                with open(backup_path, 'rb') as f_in:
                    with gzip.open(compressed_path, 'wb') as f_out:
                        shutil.copyfileobj(f_in, f_out)
                
                os.remove(backup_path)
                backup_path = compressed_path
            
            logger.info(f"Backup created successfully: {backup_path}")
            return backup_path
            
        except Exception as e:
            logger.error(f"Backup creation failed: {str(e)}")
            raise
    
    def restore_backup(self, backup_path: str) -> bool:
        """Restore database from backup"""
        try:
            # Decompress if needed
            if backup_path.endswith('.gz'):
                decompressed_path = backup_path[:-3]
                with gzip.open(backup_path, 'rb') as f_in:
                    with open(decompressed_path, 'wb') as f_out:
                        shutil.copyfileobj(f_in, f_out)
                backup_path = decompressed_path
            
            # Create psql command
            cmd = [
                "psql",
                f"--host={self.db_config['host']}",
                f"--port={self.db_config['port']}",
                f"--username={self.db_config['user']}",
                f"--dbname={self.db_config['name']}",
                "--no-password",
                f"--file={backup_path}"
            ]
            
            # Set password via environment
            env = os.environ.copy()
            env['PGPASSWORD'] = self.db_config['password']
            
            # Execute restore
            result = subprocess.run(cmd, env=env, capture_output=True, text=True)
            
            if result.returncode != 0:
                raise Exception(f"psql restore failed: {result.stderr}")
            
            logger.info(f"Database restored successfully from: {backup_path}")
            return True
            
        except Exception as e:
            logger.error(f"Database restore failed: {str(e)}")
            return False
    
    def cleanup_old_backups(self, retention_days: int = 30):
        """Remove backups older than retention period"""
        cutoff_date = datetime.now() - timedelta(days=retention_days)
        
        backup_files = [f for f in os.listdir(self.backup_dir) 
                       if f.startswith("kisaan_center_backup_")]
        
        removed_count = 0
        for backup_file in backup_files:
            backup_path = os.path.join(self.backup_dir, backup_file)
            file_time = datetime.fromtimestamp(os.path.getmtime(backup_path))
            
            if file_time < cutoff_date:
                os.remove(backup_path)
                removed_count += 1
                logger.info(f"Removed old backup: {backup_file}")
        
        logger.info(f"Cleanup completed. Removed {removed_count} old backups")
    
    def list_backups(self) -> List[dict]:
        """List all available backups"""
        backup_files = [f for f in os.listdir(self.backup_dir) 
                       if f.startswith("kisaan_center_backup_")]
        
        backups = []
        for backup_file in backup_files:
            backup_path = os.path.join(self.backup_dir, backup_file)
            file_stats = os.stat(backup_path)
            
            backups.append({
                "filename": backup_file,
                "path": backup_path,
                "size_mb": round(file_stats.st_size / (1024 * 1024), 2),
                "created_at": datetime.fromtimestamp(file_stats.st_ctime),
                "modified_at": datetime.fromtimestamp(file_stats.st_mtime)
            })
        
        return sorted(backups, key=lambda x: x["created_at"], reverse=True)
