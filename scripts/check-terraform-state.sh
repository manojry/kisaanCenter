#!/bin/bash

# Terraform Remote State Setup Helper
# This script helps initialize Terraform with remote state backend

set -e

echo "🔧 Terraform Remote State Setup"
echo "==============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

info() {
    echo -e "ℹ️  $1"
}

# Check if we're in the right directory
if [ ! -d "terraform" ]; then
    error "terraform directory not found. Please run from project root."
    exit 1
fi

# Check Azure login
if ! az account show &> /dev/null; then
    error "Azure CLI not logged in. Run: az login"
    exit 1
fi

echo "📋 Checking Terraform setup..."

# Check if bootstrap was run
if [ -d "terraform/bootstrap" ]; then
    info "Bootstrap directory found"
    
    # Check if storage account exists
    cd terraform/bootstrap
    if [ -f "terraform.tfstate" ] && terraform output &> /dev/null; then
        STORAGE_ACCOUNT=$(terraform output -raw storage_account_name 2>/dev/null || echo "")
        CONTAINER_NAME=$(terraform output -raw container_name 2>/dev/null || echo "")
        RESOURCE_GROUP=$(terraform output -raw resource_group_name 2>/dev/null || echo "")
        
        if [ -n "$STORAGE_ACCOUNT" ]; then
            success "Bootstrap storage account: $STORAGE_ACCOUNT"
        else
            warning "Bootstrap outputs not available"
        fi
    else
        warning "Bootstrap not applied. You may need to run bootstrap first."
    fi
    cd ../..
else
    warning "Bootstrap directory not found"
fi

# Check main Terraform directory
cd terraform

if [ -d ".terraform" ]; then
    success "Terraform is initialized"
    
    # Check backend configuration
    if [ -f ".terraform/terraform.tfstate" ]; then
        BACKEND_TYPE=$(jq -r '.backend.type // "local"' .terraform/terraform.tfstate 2>/dev/null || echo "local")
        if [ "$BACKEND_TYPE" = "azurerm" ]; then
            success "Remote backend (Azure Storage) is configured"
        else
            warning "Backend type: $BACKEND_TYPE"
        fi
    fi
    
    # Test remote state access
    if terraform output &> /dev/null; then
        success "Remote state is accessible"
        
        # List available outputs
        echo ""
        info "Available Terraform outputs:"
        terraform output 2>/dev/null | head -10
    else
        warning "Cannot access remote state. May need to run terraform apply."
    fi
else
    warning "Terraform not initialized in main directory"
    info "You may need to run: terraform init"
fi

cd ..

echo ""
echo "📝 Quick Commands:"
echo ""
echo "Initialize Terraform (if needed):"
echo "  cd terraform && terraform init"
echo ""
echo "Apply infrastructure:"
echo "  cd terraform && terraform apply"
echo ""
echo "Setup GitHub secrets:"
echo "  ./scripts/setup-github-secrets.sh"
echo ""
echo "Validate setup:"
echo "  ./scripts/validate-deployment-setup.sh"
echo ""

success "Terraform remote state check complete!"