import requests
import json

# 1. Create Superadmin
superadmin_payload = {
    "username": "superadmin_terminal",
    "password": "superpass123",
    "role": "SUPERADMIN",
    "contact": "9999999999"
}
superadmin_resp = requests.post("http://127.0.0.1:8000/api/v1/users/", headers={"Content-Type": "application/json"}, json=superadmin_payload)
print("Superadmin:", superadmin_resp.status_code, superadmin_resp.text)
superadmin_id = None
try:
    superadmin_id = superadmin_resp.json()["data"]["id"]
except Exception:
    print("Could not extract superadmin ID.")

# 2. Create Owner
if superadmin_id:
    owner_payload = {
        "username": "owner_terminal",
        "password": "testpass123",
        "role": "OWNER",
        "contact": "9876543210",
        "created_by": superadmin_id
    }
    owner_resp = requests.post("http://127.0.0.1:8000/api/v1/users/", headers={"Content-Type": "application/json"}, json=owner_payload)
    print("Owner:", owner_resp.status_code, owner_resp.text)
    owner_id = None
    try:
        owner_id = owner_resp.json()["data"]["id"]
    except Exception:
        print("Could not extract owner ID.")
else:
    print("Superadmin creation failed, cannot create owner.")
    owner_id = None

# 3. Create Shop
if owner_id:
    shop_payload = {
        "name": "Owner Shop Terminal",
        "location": "Test Location",
        "plan_id": 1,
        "owner_id": owner_id
    }
    shop_resp = requests.post("http://127.0.0.1:8000/api/v1/shops/", headers={"Content-Type": "application/json"}, json=shop_payload)
    print("Shop:", shop_resp.status_code, shop_resp.text)
else:
    print("Owner creation failed, cannot create shop.")
#!/usr/bin/env python3
"""
Cross-Platform KisaanCenter Setup Script

This script automatically sets up the complete KisaanCenter environment
and runs the application with a single command.

Works on: macOS, Windows, Linux

Usage:
    python setup_and_run.py [--port 8000] [--dev] [--reset-db]
    
Arguments:
    --port: Port to run the server on (default: 8000)
    --dev: Run in development mode with auto-reload
    --reset-db: Reset database and run migrations
    --help: Show this help message
"""

import os
import sys
import subprocess
import platform
import argparse
import shutil
import urllib.request
from pathlib import Path

# Color codes for cross-platform terminal output
class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'

    @staticmethod
    def disable_on_windows():
        """Disable colors on Windows if not supported"""
        if platform.system() == 'Windows':
            for attr in dir(Colors):
                if not attr.startswith('_') and attr != 'disable_on_windows':
                    setattr(Colors, attr, '')

# Disable colors on Windows if needed
if platform.system() == 'Windows':
    try:
        # Try to enable ANSI colors on Windows 10+
        import ctypes
        kernel32 = ctypes.windll.kernel32
        kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
    except:
        Colors.disable_on_windows()

def print_header():
    """Print application header"""
    print(f"""
{Colors.CYAN}{Colors.BOLD}
╔══════════════════════════════════════════════════════════════╗
║                    🌾 KISAAN CENTER 🌾                      ║
║              Agricultural Market Management System           ║
║                     Cross-Platform Setup                    ║
╚══════════════════════════════════════════════════════════════╝
{Colors.END}

{Colors.GREEN}System Information:{Colors.END}
• Operating System: {platform.system()} {platform.release()}
• Python Version: {sys.version.split()[0]}
• Architecture: {platform.machine()}
• Current Directory: {os.getcwd()}
""")

def check_prerequisites():
    """Check system prerequisites"""
    print(f"{Colors.YELLOW}🔍 Checking Prerequisites...{Colors.END}")
    
    # Check Python version
    if sys.version_info < (3, 8):
        print(f"{Colors.RED}❌ Python 3.8+ required. Current: {sys.version}{Colors.END}")
        sys.exit(1)
    print(f"{Colors.GREEN}✅ Python {sys.version.split()[0]} - OK{Colors.END}")
    
    # Check pip
    try:
        subprocess.run([sys.executable, '-m', 'pip', '--version'], check=True, capture_output=True)
        print(f"{Colors.GREEN}✅ pip - OK{Colors.END}")
    except subprocess.CalledProcessError:
        print(f"{Colors.RED}❌ pip not found{Colors.END}")
        sys.exit(1)

def get_python_executable():
    """Get the correct Python executable for the platform"""
    if platform.system() == 'Windows':
        return 'python'
    else:
        return 'python3'

def get_venv_activation_script():
    """Get virtual environment activation script path"""
    if platform.system() == 'Windows':
        return os.path.join('.venv', 'Scripts', 'activate.bat')
    else:
        return os.path.join('.venv', 'bin', 'activate')

def get_venv_python():
    """Get virtual environment Python executable"""
    if platform.system() == 'Windows':
        return os.path.join('.venv', 'Scripts', 'python.exe')
    else:
        # Check if the symlink exists, if not use python3
        venv_python = os.path.join('.venv', 'bin', 'python')
        if os.path.exists(venv_python):
            return venv_python
        else:
            # Fallback to system python if venv python doesn't exist
            return sys.executable

def create_virtual_environment():
    """Create virtual environment"""
    print(f"{Colors.YELLOW}🔧 Setting up Virtual Environment...{Colors.END}")
    
    if os.path.exists('.venv'):
        print(f"{Colors.BLUE}ℹ️  Virtual environment exists, skipping creation{Colors.END}")
        return
    
    python_cmd = get_python_executable()
    
    try:
        subprocess.run([python_cmd, '-m', 'venv', '.venv'], check=True)
        print(f"{Colors.GREEN}✅ Virtual environment created{Colors.END}")
    except subprocess.CalledProcessError as e:
        print(f"{Colors.RED}❌ Failed to create virtual environment: {e}{Colors.END}")
        sys.exit(1)

def install_dependencies():
    """Install Python dependencies"""
    print(f"{Colors.YELLOW}📦 Installing Dependencies...{Colors.END}")
    
    venv_python = get_venv_python()
    
    # Core dependencies
    dependencies = [
        'fastapi>=0.104.0',
        'uvicorn[standard]>=0.24.0',
        'sqlalchemy>=2.0.0',
        'psycopg2-binary>=2.9.0',  # PostgreSQL adapter
        'python-dotenv>=1.0.0',
        'pydantic>=2.0.0',
        'passlib>=1.7.4',
        'werkzeug>=3.0.0',
        'alembic>=1.12.0',
        'pytest>=7.4.0',
        'requests>=2.31.0',
        'python-multipart>=0.0.6'
    ]
    
    for dep in dependencies:
        try:
            # Use public PyPI index to avoid corporate proxy issues
            subprocess.run([
                venv_python, '-m', 'pip', 'install', 
                '--index-url', 'https://pypi.org/simple/', 
                dep
            ], check=True, capture_output=True)
            print(f"{Colors.GREEN}✅ {dep.split('>=')[0]}{Colors.END}")
        except subprocess.CalledProcessError as e:
            print(f"{Colors.RED}❌ Failed to install {dep}: {e}{Colors.END}")
            # Continue with other dependencies

def setup_environment_file():
    """Setup .env file"""
    print(f"{Colors.YELLOW}⚙️  Setting up Environment Configuration...{Colors.END}")
    
    env_file = '.env'
    if os.path.exists(env_file):
        print(f"{Colors.BLUE}ℹ️  .env file exists, skipping creation{Colors.END}")
        return
    
    env_content = """# KisaanCenter Environment Configuration

# Database Configuration (PostgreSQL RDS)
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=kisaan_center
DB_PORT=5432

# Local SQLite for development (comment out above and uncomment below)
# DATABASE_URL=sqlite:///./kisaan_center.db

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true

# Security
SECRET_KEY=your-super-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application Settings
APP_NAME=KisaanCenter Market Management System
APP_VERSION=1.0.0
CORS_ORIGINS=http://localhost:3000,http://localhost:8080

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/app.log
"""
    
    try:
        with open(env_file, 'w') as f:
            f.write(env_content)
        print(f"{Colors.GREEN}✅ Environment file created{Colors.END}")
        print(f"{Colors.YELLOW}⚠️  Please update .env with your actual database credentials{Colors.END}")
    except Exception as e:
        print(f"{Colors.RED}❌ Failed to create .env file: {e}{Colors.END}")

def setup_directories():
    """Setup required directories"""
    print(f"{Colors.YELLOW}📁 Setting up Directory Structure...{Colors.END}")
    
    directories = [
        'logs',
        'uploads',
        'backups',
        'tmp'
    ]
    
    for directory in directories:
        try:
            os.makedirs(directory, exist_ok=True)
            print(f"{Colors.GREEN}✅ {directory}/ directory{Colors.END}")
        except Exception as e:
            print(f"{Colors.RED}❌ Failed to create {directory}: {e}{Colors.END}")

def run_database_migration():
    """Run database migrations"""
    print(f"{Colors.YELLOW}🗄️  Running Database Migrations...{Colors.END}")
    
    venv_python = get_venv_python()
    migration_script = 'migrate_subscription.py'  # Script is in backend directory
    env = os.environ.copy()
    env['PYTHONPATH'] = os.path.join(os.getcwd(), 'backend')

    # Run custom migration script if present
    migration_script_path = os.path.join('backend', migration_script)
    if os.path.exists(migration_script_path):
        try:
            if not os.path.isabs(venv_python):
                venv_python = os.path.join(os.getcwd(), venv_python)
            subprocess.run([venv_python, migration_script], check=True, cwd='backend', env=env)
            print(f"{Colors.GREEN}✅ Custom migration script completed{Colors.END}")
        except Exception as e:
            print(f"{Colors.YELLOW}⚠️  Custom migration script failed: {e}{Colors.END}")
    else:
        print(f"{Colors.YELLOW}⚠️  Custom migration script not found, skipping{Colors.END}")

    # Run Alembic migrations
    print(f"{Colors.YELLOW}🗄️  Running Alembic migrations...{Colors.END}")
    try:
        subprocess.run([venv_python, '-m', 'alembic', 'upgrade', 'head'], check=True, cwd='backend', env=env)
        print(f"{Colors.GREEN}✅ Alembic migrations completed{Colors.END}")
    except Exception as e:
        print(f"{Colors.RED}❌ Alembic migration failed: {e}{Colors.END}")

def start_application(port=8000, dev_mode=False):
    """Start the FastAPI application"""
    print(f"{Colors.YELLOW}🚀 Starting KisaanCenter Application...{Colors.END}")
    
    venv_python = get_venv_python()
    
    # Use absolute path for venv_python if it's relative
    if not os.path.isabs(venv_python):
        venv_python = os.path.join(os.getcwd(), venv_python)
    
    # Setup environment
    env = os.environ.copy()
    env['PYTHONPATH'] = os.path.join(os.getcwd(), 'backend')
    
    # Build uvicorn command
    uvicorn_cmd = [
        venv_python, '-m', 'uvicorn',
        'src.main:app',
        '--host', '0.0.0.0',
        '--port', str(port)
    ]
    
    if dev_mode:
        uvicorn_cmd.extend(['--reload', '--reload-dir', 'backend/src'])
    
    print(f"{Colors.GREEN}🌐 Server will be available at:{Colors.END}")
    print(f"   • API: {Colors.CYAN}http://localhost:{port}{Colors.END}")
    print(f"   • Docs: {Colors.CYAN}http://localhost:{port}/docs{Colors.END}")
    print(f"   • ReDoc: {Colors.CYAN}http://localhost:{port}/redoc{Colors.END}")
    print(f"   • Subscriptions: {Colors.CYAN}http://localhost:{port}/api/v1/subscriptions{Colors.END}")
    print(f"   • Super Admin: {Colors.CYAN}http://localhost:{port}/api/v1/admin{Colors.END}")
    print()
    print(f"{Colors.YELLOW}Press Ctrl+C to stop the server{Colors.END}")
    print("=" * 60)
    
    try:
        subprocess.run(uvicorn_cmd, cwd='backend', env=env)
    except KeyboardInterrupt:
        print(f"\n{Colors.GREEN}👋 KisaanCenter stopped gracefully{Colors.END}")
    except FileNotFoundError as e:
        print(f"{Colors.RED}❌ Python executable not found: {e}{Colors.END}")
        print(f"{Colors.YELLOW}Trying with system python...{Colors.END}")
        try:
            uvicorn_cmd[0] = sys.executable
            subprocess.run(uvicorn_cmd, cwd='backend', env=env)
        except Exception as fallback_e:
            print(f"{Colors.RED}❌ Failed to start application: {fallback_e}{Colors.END}")
            sys.exit(1)
    except Exception as e:
        print(f"{Colors.RED}❌ Failed to start application: {e}{Colors.END}")
        sys.exit(1)

def reset_database():
    """Reset database and run fresh migrations"""
    print(f"{Colors.YELLOW}🔄 Resetting Database...{Colors.END}")
    
    # Remove SQLite database if exists
    db_files = ['kisaan_center.db', 'test.db', 'backend/test.db']
    for db_file in db_files:
        if os.path.exists(db_file):
            os.remove(db_file)
            print(f"{Colors.GREEN}✅ Removed {db_file}{Colors.END}")
    
    # Run migrations
    run_database_migration()

def main():
    """Main setup and run function"""
    parser = argparse.ArgumentParser(description='KisaanCenter Setup and Run Script')
    parser.add_argument('--port', type=int, default=8000, help='Port to run server on')
    parser.add_argument('--dev', action='store_true', help='Run in development mode')
    parser.add_argument('--reset-db', action='store_true', help='Reset database')
    parser.add_argument('--setup-only', action='store_true', help='Setup only, do not start server')
    
    args = parser.parse_args()
    
    print_header()
    
    try:
        # Setup phase
        check_prerequisites()
        create_virtual_environment()
        install_dependencies()
        setup_environment_file()
        setup_directories()
        
        if args.reset_db:
            reset_database()
        else:
            run_database_migration()
        
        print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 Setup completed successfully!{Colors.END}")
        
        if args.setup_only:
            print(f"{Colors.BLUE}Setup complete. Run 'python setup_and_run.py' to start the server.{Colors.END}")
            return
        
        # Start application
        print(f"\n{Colors.CYAN}Starting application...{Colors.END}")
        start_application(port=args.port, dev_mode=args.dev)
        
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Setup interrupted by user{Colors.END}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Colors.RED}❌ Setup failed: {e}{Colors.END}")
        sys.exit(1)

if __name__ == '__main__':
    main()
