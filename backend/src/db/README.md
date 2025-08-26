# 🗄️ KisaanCenter Database Infrastructure

A robust, production-ready database setup for the KisaanCenter agricultural commodity trading platform.

## ✨ Features

- **🔗 Connection Pooling**: Efficient PostgreSQL connection management with configurable pools
- **🔄 Migration System**: Alembic-based schema versioning and database migrations  
- **🌱 Data Seeding**: Automated initial data setup with reference and test data
- **🏥 Health Monitoring**: Comprehensive database health checks and connection monitoring
- **🔒 Security**: SSL support, connection timeouts, and secure credential management
- **⚡ Performance**: Optimized indexes, query timeouts, and connection reuse
- **🛠️ Management Tools**: CLI tools for database setup, backup, and maintenance

## 🚀 Quick Start

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Configure database credentials in .env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kisaan_center
DB_USER=kisaan_user
DB_PASSWORD=your_secure_password

# 3. Install dependencies
pip install -r requirements.txt

# 4. Initialize database with test data
python db_manager.py setup --create-db --seed-data --include-test-data

# 5. Verify setup
python db_manager.py health
```

## 📁 Structure

```
db/
├── connection.py           # Connection pooling & management
├── init_db.py             # Database initialization utilities  
├── db_manager.py          # CLI management tool
├── backup_manager.py      # Backup & maintenance utilities
├── requirements.txt       # Python dependencies
├── .env.example          # Environment configuration template
├── DATABASE_SETUP_GUIDE.md  # Complete setup documentation
├── migrations/           # Alembic migration files
│   ├── alembic.ini       # Migration configuration
│   ├── env.py           # Migration environment
│   └── versions/        # Migration version files
└── seeds/               # Data seeding utilities
    ├── seed_data.py     # Seeding logic and reference data
    └── __init__.py
```

## 🎯 Key Commands

```bash
# Database Setup
python db_manager.py setup --create-db --seed-data    # Complete setup
python db_manager.py health                           # Health check
python db_manager.py info                             # Database info

# Data Management  
python db_manager.py seed --include-test-data         # Seed with test data
python db_manager.py seed --reference-only            # Reference data only

# Migrations
python db_manager.py migrate revision -m "description"  # New migration
python db_manager.py migrate upgrade                    # Apply migrations
python db_manager.py migrate history                    # Migration history

# Backup & Maintenance
python backup_manager.py backup                       # Create backup
python backup_manager.py list                         # List backups  
python backup_manager.py maintenance                  # Database maintenance
```

## 💻 Usage in Code

```python
# Modern approach (recommended)
from db.connection import get_db_session
from models import User

# Context manager for automatic session handling
with get_db_session() as session:
    user = session.query(User).filter_by(email="farmer@example.com").first()
    print(f"User: {user.name}")

# FastAPI integration
from db.connection import get_db
from fastapi import Depends

@app.get("/users/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    return db.query(User).filter(User.id == user_id).first()

# Application startup
from db.init_db import initialize_database

@app.on_event("startup")
async def startup_event():
    initialize_database(create_tables=True)
```

## 🔧 Configuration

Key environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | localhost | Database server host |
| `DB_NAME` | kisaan_center | Database name |
| `DB_USER` | kisaan_user | Database user |
| `DB_PASSWORD` | - | Database password |
| `DB_POOL_SIZE` | 10 | Connection pool size |
| `DB_MAX_OVERFLOW` | 20 | Max overflow connections |
| `ENVIRONMENT` | development | Environment type |

## 🛡️ Security Features

- **SSL Connections**: Configurable SSL modes for secure connections
- **Connection Encryption**: End-to-end connection security
- **Credential Management**: Environment-based credential storage
- **Query Timeouts**: Protection against long-running queries
- **Connection Limits**: Prevent connection exhaustion

## 📊 Database Schema

The system supports a comprehensive agricultural trading platform with:

- **Multi-role Users**: Farmers, Buyers, Shop Owners, Employees, Superadmin
- **Shop Management**: Owner-managed agricultural commodity shops  
- **Product Catalog**: Categorized commodity inventory
- **Transaction System**: Complete transaction lifecycle with payments
- **Credit Management**: Credit transactions and payment tracking
- **Audit System**: Complete audit trail for all operations

## 🔄 Migration Support

- **Automatic Schema Detection**: Alembic auto-generates migrations from model changes
- **Version Control**: Complete migration history and rollback support
- **Environment Isolation**: Separate migration tracking per environment
- **Safe Operations**: Built-in safeguards for production deployments

## 📈 Performance Features

- **Connection Pooling**: Efficient connection reuse and management
- **Optimized Indexes**: Automatic creation of performance indexes
- **Query Optimization**: Built-in query timeout and optimization settings
- **Resource Monitoring**: Connection pool and performance metrics

## 🆘 Support

For detailed setup instructions, see [`DATABASE_SETUP_GUIDE.md`](DATABASE_SETUP_GUIDE.md).

For troubleshooting and advanced configuration, refer to the comprehensive guide included in this package.

## 🎉 Ready to Scale

This database infrastructure is designed to grow with your application:

- ✅ **Development**: Easy setup with test data and debugging features
- ✅ **Staging**: Production-like environment with migration support  
- ✅ **Production**: Robust connection pooling, monitoring, and security
- ✅ **Enterprise**: Horizontal scaling with read replicas and advanced features

Start building your agricultural commodity trading platform with confidence! 🌾
