#!/bin/bash
# Unix/Linux/macOS Shell Script for KisaanCenter Setup and Run
# Usage: ./setup_and_run.sh [port] [dev]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "============================================================"
echo "                   🌾 KISAAN CENTER 🌾"
echo "              Unix/Linux/macOS Setup Script"
echo "============================================================"
echo -e "${NC}"

# Set default port
PORT=${1:-8000}

# Check for dev mode
DEV_MODE=""
if [ "$2" = "dev" ]; then
    DEV_MODE="--dev"
fi

# Check Python installation
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 not found. Please install Python 3.8+${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Python found: $(python3 --version)${NC}"
echo

# Make script executable if not already
chmod +x setup_and_run.py

# Run the main setup script
echo -e "${YELLOW}🚀 Running KisaanCenter setup...${NC}"
python3 setup_and_run.py --port $PORT $DEV_MODE

if [ $? -eq 0 ]; then
    echo
    echo -e "${GREEN}✅ KisaanCenter setup completed successfully!${NC}"
else
    echo
    echo -e "${RED}❌ Setup failed. Check the error messages above.${NC}"
    exit 1
fi
