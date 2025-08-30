#!/bin/bash

# PostgreSQL Installation and Configuration Script
# This script installs and configures PostgreSQL on Ubuntu

set -e

# Update system packages
apt-get update -y
apt-get upgrade -y

# Install PostgreSQL 15
apt-get install -y postgresql postgresql-contrib

# Install additional tools
apt-get install -y htop nano curl wget

# Format and mount the data disk
if [ -b /dev/disk/azure/scsi1/lun10 ]; then
    # Create filesystem on the data disk
    mkfs.ext4 /dev/disk/azure/scsi1/lun10
    
    # Create mount point
    mkdir -p /var/lib/postgresql/data
    
    # Mount the disk
    mount /dev/disk/azure/scsi1/lun10 /var/lib/postgresql/data
    
    # Add to fstab for persistent mounting
    echo '/dev/disk/azure/scsi1/lun10 /var/lib/postgresql/data ext4 defaults 0 2' >> /etc/fstab
    
    # Set ownership
    chown -R postgres:postgres /var/lib/postgresql/data
    chmod 750 /var/lib/postgresql/data
fi

# Stop PostgreSQL to reconfigure data directory
systemctl stop postgresql

# Initialize PostgreSQL data directory on the mounted disk
sudo -u postgres /usr/lib/postgresql/15/bin/initdb -D /var/lib/postgresql/data/main

# Configure PostgreSQL
cat > /etc/postgresql/15/main/postgresql.conf << EOF
# PostgreSQL Configuration for KisaanCenter
data_directory = '/var/lib/postgresql/data/main'
hba_file = '/etc/postgresql/15/main/pg_hba.conf'
ident_file = '/etc/postgresql/15/main/pg_ident.conf'
external_pid_file = '/var/run/postgresql/15-main.pid'

# Connection settings
listen_addresses = '*'
port = 5432
max_connections = 100

# Memory settings (optimized for 1GB RAM)
shared_buffers = 128MB
effective_cache_size = 512MB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_statement = 'none'
log_min_duration_statement = 1000

# SSL
ssl = on
ssl_cert_file = '/etc/ssl/certs/ssl-cert-snakeoil.pem'
ssl_key_file = '/etc/ssl/private/ssl-cert-snakeoil.key'
EOF

# Configure authentication
cat > /etc/postgresql/15/main/pg_hba.conf << EOF
# PostgreSQL Client Authentication Configuration
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# Local connections
local   all             postgres                                peer
local   all             all                                     peer

# IPv4 local connections:
host    all             all             127.0.0.1/32            scram-sha-256

# IPv6 local connections:
host    all             all             ::1/128                 scram-sha-256

# Allow connections from backend subnet
host    all             all             10.0.1.0/24             scram-sha-256

# Allow connections from database subnet
host    all             all             10.0.2.0/24             scram-sha-256
EOF

# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Set postgres user password and create database
sudo -u postgres psql << EOF
ALTER USER postgres PASSWORD '${postgresql_password}';
CREATE DATABASE kisaancenter;
GRANT ALL PRIVILEGES ON DATABASE kisaancenter TO postgres;
\q
EOF

# Create application user
sudo -u postgres createuser --createdb --no-superuser --no-createrole kisaancenter_user
sudo -u postgres psql << EOF
ALTER USER kisaancenter_user PASSWORD '${postgresql_password}';
GRANT ALL PRIVILEGES ON DATABASE kisaancenter TO kisaancenter_user;
\q
EOF

# Configure firewall (ufw)
ufw --force enable
ufw allow from 10.0.0.0/16 to any port 5432
ufw allow from 10.0.0.0/16 to any port 22

# Create backup script
cat > /home/azureuser/backup_postgresql.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/lib/postgresql/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Create database backup
sudo -u postgres pg_dump kisaancenter > $BACKUP_DIR/kisaancenter_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "Backup completed: kisaancenter_$DATE.sql"
EOF

chmod +x /home/azureuser/backup_postgresql.sh
chown azureuser:azureuser /home/azureuser/backup_postgresql.sh

# Add daily backup cron job
echo "0 2 * * * /home/azureuser/backup_postgresql.sh" | crontab -u azureuser -

# Create status check script
cat > /home/azureuser/check_postgresql.sh << 'EOF'
#!/bin/bash
echo "=== PostgreSQL Status ==="
systemctl status postgresql --no-pager
echo ""
echo "=== PostgreSQL Connections ==="
sudo -u postgres psql -c "SELECT datname, usename, client_addr, state FROM pg_stat_activity WHERE datname = 'kisaancenter';"
echo ""
echo "=== Disk Usage ==="
df -h /var/lib/postgresql/data
EOF

chmod +x /home/azureuser/check_postgresql.sh
chown azureuser:azureuser /home/azureuser/check_postgresql.sh

# Log installation completion
echo "PostgreSQL installation completed at $(date)" > /var/log/postgresql_installation.log
echo "Database: kisaancenter" >> /var/log/postgresql_installation.log
echo "Users: postgres, kisaancenter_user" >> /var/log/postgresql_installation.log
echo "Port: 5432" >> /var/log/postgresql_installation.log
echo "Data Directory: /var/lib/postgresql/data/main" >> /var/log/postgresql_installation.log

# Restart PostgreSQL with new configuration
systemctl restart postgresql

echo "PostgreSQL setup completed successfully!"