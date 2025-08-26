# Production Deployment Guide

## Overview

This guide covers deploying the Market Management System API to production with enterprise-grade configuration, monitoring, and security.

## Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04 LTS or CentOS 8+
- **Python**: 3.9+
- **Database**: PostgreSQL 13+ (recommended) or SQLite for development
- **Memory**: Minimum 4GB RAM, 8GB+ recommended
- **Storage**: 50GB+ SSD storage
- **Network**: HTTPS/SSL certificate for production

### Dependencies
```bash
# System packages
sudo apt update
sudo apt install -y python3-pip python3-venv nginx postgresql postgresql-contrib redis-server

# Python packages (installed via requirements.txt)
pip install -r requirements.txt
```

## Environment Setup

### 1. Database Configuration

#### PostgreSQL Setup
```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE kisaan_center;
CREATE USER kisaan_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE kisaan_center TO kisaan_user;
\q
```

#### Environment Variables
Create `.env` file in `backend/src/db/`:
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kisaan_center
DB_USER=kisaan_user
DB_PASSWORD=your_secure_password
DB_SSL_MODE=require

# Application Configuration
ENVIRONMENT=production
LOG_LEVEL=INFO
SECRET_KEY=your_secret_key_here

# Connection Pool Settings
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=30
DB_POOL_RECYCLE=3600
DB_POOL_PRE_PING=true

# Security Settings
ALLOWED_HOSTS=your-domain.com,api.your-domain.com
CORS_ORIGINS=https://your-frontend-domain.com

# Monitoring
SENTRY_DSN=your_sentry_dsn_here
```

### 2. Application Setup

#### Virtual Environment
```bash
cd /opt/kisaan-center
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Database Initialization
```bash
# Initialize database schema
python -m backend.src.db.init_db

# Seed initial data
python -m backend.src.db.seeds.seed_data
```

### 3. Web Server Configuration

#### Gunicorn Configuration
Create `gunicorn.conf.py`:
```python
# Gunicorn configuration
bind = "127.0.0.1:8000"
workers = 4
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 2
preload_app = True

# Logging
accesslog = "/var/log/kisaan-center/access.log"
errorlog = "/var/log/kisaan-center/error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "kisaan-center-api"

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190
```

#### Nginx Configuration
Create `/etc/nginx/sites-available/kisaan-center`:
```nginx
upstream kisaan_backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name api.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Proxy Configuration
    location / {
        proxy_pass http://kisaan_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Health check endpoint (no rate limiting)
    location /health {
        proxy_pass http://kisaan_backend;
        proxy_set_header Host $host;
        access_log off;
    }

    # Static files (if any)
    location /static/ {
        alias /opt/kisaan-center/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 4. Systemd Service

Create `/etc/systemd/system/kisaan-center.service`:
```ini
[Unit]
Description=Kisaan Center API
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=notify
User=kisaan
Group=kisaan
WorkingDirectory=/opt/kisaan-center
Environment=PATH=/opt/kisaan-center/venv/bin
ExecStart=/opt/kisaan-center/venv/bin/gunicorn -c gunicorn.conf.py backend.src.main:app
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=5
KillMode=mixed
TimeoutStopSec=5

# Security settings
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/opt/kisaan-center /var/log/kisaan-center

[Install]
WantedBy=multi-user.target
```

## Security Configuration

### 1. Firewall Setup
```bash
# UFW configuration
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 2. SSL/TLS Certificate
```bash
# Using Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.your-domain.com
```

### 3. Database Security
```bash
# PostgreSQL security
sudo -u postgres psql
ALTER USER kisaan_user SET default_transaction_isolation TO 'read committed';
ALTER USER kisaan_user SET timezone TO 'UTC';
ALTER USER kisaan_user SET client_encoding TO 'utf8';
\q

# Backup user (read-only)
sudo -u postgres createuser --no-createdb --no-createrole --no-superuser backup_user
sudo -u postgres psql -c "GRANT CONNECT ON DATABASE kisaan_center TO backup_user;"
sudo -u postgres psql -d kisaan_center -c "GRANT USAGE ON SCHEMA public TO backup_user;"
sudo -u postgres psql -d kisaan_center -c "GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_user;"
```

## Monitoring & Logging

### 1. Application Monitoring

#### Health Checks
```bash
# Create health check script
cat > /opt/kisaan-center/health_check.sh << 'EOF'
#!/bin/bash
HEALTH_URL="https://api.your-domain.com/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "API is healthy"
    exit 0
else
    echo "API health check failed with status: $RESPONSE"
    exit 1
fi
EOF

chmod +x /opt/kisaan-center/health_check.sh
```

#### Cron Job for Health Monitoring
```bash
# Add to crontab
*/5 * * * * /opt/kisaan-center/health_check.sh >> /var/log/kisaan-center/health.log 2>&1
```

### 2. Log Management

#### Logrotate Configuration
Create `/etc/logrotate.d/kisaan-center`:
```
/var/log/kisaan-center/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 kisaan kisaan
    postrotate
        systemctl reload kisaan-center
    endscript
}
```

### 3. Performance Monitoring

#### System Metrics
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Database monitoring
sudo apt install postgresql-contrib
```

## Backup Strategy

### 1. Database Backup
```bash
# Create backup script
cat > /opt/kisaan-center/backup_db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/kisaan-center"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/kisaan_center_$DATE.sql"

mkdir -p $BACKUP_DIR

# Create backup
pg_dump -h localhost -U backup_user -d kisaan_center > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
EOF

chmod +x /opt/kisaan-center/backup_db.sh

# Schedule daily backups
echo "0 2 * * * /opt/kisaan-center/backup_db.sh" | crontab -
```

### 2. Application Backup
```bash
# Backup application files
tar -czf /opt/backups/kisaan-center-app-$(date +%Y%m%d).tar.gz \
    /opt/kisaan-center \
    --exclude=/opt/kisaan-center/venv \
    --exclude=/opt/kisaan-center/__pycache__ \
    --exclude=/opt/kisaan-center/.git
```

## Deployment Process

### 1. Initial Deployment
```bash
# 1. Clone repository
git clone https://github.com/your-org/kisaan-center.git /opt/kisaan-center

# 2. Setup environment
cd /opt/kisaan-center
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. Configure environment
cp backend/src/db/.env.example backend/src/db/.env
# Edit .env with production values

# 4. Initialize database
python -m backend.src.db.init_db
python -m backend.src.db.seeds.seed_data

# 5. Start services
sudo systemctl enable kisaan-center
sudo systemctl start kisaan-center
sudo systemctl enable nginx
sudo systemctl start nginx

# 6. Verify deployment
curl https://api.your-domain.com/health
```

### 2. Updates and Maintenance
```bash
# Update deployment script
cat > /opt/kisaan-center/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "Starting deployment..."

# Backup current version
cp -r /opt/kisaan-center /opt/backups/kisaan-center-$(date +%Y%m%d_%H%M%S)

# Pull latest code
cd /opt/kisaan-center
git pull origin main

# Update dependencies
source venv/bin/activate
pip install -r requirements.txt

# Run database migrations (if any)
python -m backend.src.db.migrations.migrate

# Restart services
sudo systemctl restart kisaan-center
sudo systemctl reload nginx

# Verify deployment
sleep 5
curl -f https://api.your-domain.com/health || {
    echo "Health check failed, rolling back..."
    # Rollback logic here
    exit 1
}

echo "Deployment completed successfully"
EOF

chmod +x /opt/kisaan-center/deploy.sh
```

## Performance Optimization

### 1. Database Optimization
```sql
-- Create performance indexes
CREATE INDEX CONCURRENTLY idx_transaction_shop_date ON transaction(shop_id, date);
CREATE INDEX CONCURRENTLY idx_transaction_buyer_status ON transaction(buyer_user_id, status);
CREATE INDEX CONCURRENTLY idx_user_shop_role ON users(shop_id, role);
CREATE INDEX CONCURRENTLY idx_farmer_stock_product ON farmer_stock(product_id, status);

-- Analyze tables for query optimization
ANALYZE;
```

### 2. Application Optimization
```python
# Connection pool tuning in .env
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=30
DB_POOL_RECYCLE=3600
DB_POOL_PRE_PING=true
```

### 3. Caching Strategy
```bash
# Redis for caching (optional)
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Check logs
sudo tail -f /var/log/postgresql/postgresql-13-main.log
```

#### 2. Application Issues
```bash
# Check service status
sudo systemctl status kisaan-center

# Check logs
sudo tail -f /var/log/kisaan-center/error.log
sudo journalctl -u kisaan-center -f

# Check process
ps aux | grep gunicorn
```

#### 3. Nginx Issues
```bash
# Test configuration
sudo nginx -t

# Check status
sudo systemctl status nginx

# Check logs
sudo tail -f /var/log/nginx/error.log
```

### Performance Monitoring
```bash
# Monitor system resources
htop
iotop
nethogs

# Monitor database
sudo -u postgres psql -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Monitor application
curl https://api.your-domain.com/health
```

## Security Checklist

- [ ] SSL/TLS certificate installed and configured
- [ ] Firewall configured (only necessary ports open)
- [ ] Database user has minimal required permissions
- [ ] Application runs as non-root user
- [ ] Security headers configured in Nginx
- [ ] Rate limiting enabled
- [ ] Regular security updates applied
- [ ] Backup strategy implemented and tested
- [ ] Monitoring and alerting configured
- [ ] Log rotation configured

## Maintenance Schedule

### Daily
- Monitor system health and performance
- Check application logs for errors
- Verify backup completion

### Weekly
- Review security logs
- Update system packages
- Performance analysis

### Monthly
- Security audit
- Backup restoration test
- Capacity planning review
- Update dependencies

This production deployment guide ensures a secure, scalable, and maintainable deployment of the Market Management System API.