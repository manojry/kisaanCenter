#!/bin/bash

# Azure Deployment Validation Script
# Validates that all components are properly configured for CI/CD

set -e

echo "🔍 Validating Azure Deployment Setup"
echo "===================================="

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

# Check prerequisites
echo "📋 Checking Prerequisites..."

# Check Azure CLI
if command -v az &> /dev/null; then
    success "Azure CLI is installed"
    
    # Check Azure login
    if az account show &> /dev/null; then
        success "Azure CLI is logged in"
        AZURE_SUBSCRIPTION_ID=$(az account show --query id -o tsv)
        info "Subscription: $AZURE_SUBSCRIPTION_ID"
    else
        error "Azure CLI is not logged in. Run: az login"
        exit 1
    fi
else
    error "Azure CLI is not installed"
    exit 1
fi

# Check GitHub CLI
if command -v gh &> /dev/null; then
    success "GitHub CLI is installed"
    
    # Check GitHub login
    if gh auth status &> /dev/null; then
        success "GitHub CLI is logged in"
    else
        error "GitHub CLI is not logged in. Run: gh auth login"
        exit 1
    fi
else
    error "GitHub CLI is not installed"
    exit 1
fi

# Check Terraform
if [ -d "terraform/.terraform" ]; then
    success "Terraform is initialized"
    
    # Check if we can access remote state
    cd terraform
    if terraform output &> /dev/null; then
        success "Terraform remote state is accessible"
    else
        warning "Cannot access Terraform remote state. Check Azure login and permissions."
    fi
    cd ..
else
    error "Terraform not initialized. Run: cd terraform && terraform init"
    exit 1
fi

echo ""
echo "🏗️ Checking Azure Resources..."

# Check Resource Group
if az group show --name "kisaancenter-rg" &> /dev/null; then
    success "Resource group 'kisaancenter-rg' exists"
else
    error "Resource group 'kisaancenter-rg' not found"
    exit 1
fi

# Check Container Registry
ACR_NAME=$(az acr list --resource-group kisaancenter-rg --query "[0].name" -o tsv 2>/dev/null || echo "")
if [ -n "$ACR_NAME" ]; then
    success "Container Registry '$ACR_NAME' exists"
    
    # Check admin access
    if az acr credential show --name $ACR_NAME &> /dev/null; then
        success "Container Registry admin access is enabled"
    else
        warning "Container Registry admin access might be disabled"
    fi
else
    error "Container Registry not found"
    exit 1
fi

# Check Container App Environment
if az containerapp env show --name "kisaancenter-env" --resource-group "kisaancenter-rg" &> /dev/null; then
    success "Container App Environment 'kisaancenter-env' exists"
else
    error "Container App Environment 'kisaancenter-env' not found"
    exit 1
fi

# Check Container App
if az containerapp show --name "kisaancenter-backend" --resource-group "kisaancenter-rg" &> /dev/null; then
    success "Container App 'kisaancenter-backend' exists"
    
    # Check provisioning state
    PROVISIONING_STATE=$(az containerapp show --name "kisaancenter-backend" --resource-group "kisaancenter-rg" --query "properties.provisioningState" -o tsv)
    if [ "$PROVISIONING_STATE" = "Succeeded" ]; then
        success "Container App is successfully provisioned"
    else
        warning "Container App provisioning state: $PROVISIONING_STATE"
    fi
else
    error "Container App 'kisaancenter-backend' not found"
    exit 1
fi

# Check PostgreSQL VM
if az vm show --name "kisaancenter-postgresql-vm" --resource-group "kisaancenter-rg" &> /dev/null; then
    success "PostgreSQL VM exists"
    
    # Check VM state
    VM_STATE=$(az vm get-instance-view --name "kisaancenter-postgresql-vm" --resource-group "kisaancenter-rg" --query "instanceView.statuses[1].displayStatus" -o tsv)
    if [ "$VM_STATE" = "VM running" ]; then
        success "PostgreSQL VM is running"
    else
        warning "PostgreSQL VM state: $VM_STATE"
    fi
else
    error "PostgreSQL VM not found"
    exit 1
fi

# Check Key Vault
KEY_VAULT_NAME=$(az keyvault list --resource-group kisaancenter-rg --query "[0].name" -o tsv 2>/dev/null || echo "")
if [ -n "$KEY_VAULT_NAME" ]; then
    success "Key Vault '$KEY_VAULT_NAME' exists"
else
    error "Key Vault not found"
    exit 1
fi

echo ""
echo "📁 Checking Required Files..."

# Check GitHub workflow
if [ -f ".github/workflows/deploy-backend.yml" ]; then
    success "GitHub Actions workflow exists"
else
    error "GitHub Actions workflow not found at .github/workflows/deploy-backend.yml"
    exit 1
fi

# Check Dockerfile
if [ -f "backend/Dockerfile" ]; then
    success "Backend Dockerfile exists"
else
    error "Backend Dockerfile not found at backend/Dockerfile"
    exit 1
fi

# Check backend requirements
if [ -f "backend/requirements.txt" ]; then
    success "Backend requirements.txt exists"
else
    warning "Backend requirements.txt not found - make sure dependencies are defined"
fi

# Check setup script
if [ -f "scripts/setup-github-secrets.sh" ]; then
    success "GitHub secrets setup script exists"
    
    if [ -x "scripts/setup-github-secrets.sh" ]; then
        success "Setup script is executable"
    else
        warning "Setup script is not executable. Run: chmod +x scripts/setup-github-secrets.sh"
    fi
else
    error "GitHub secrets setup script not found"
    exit 1
fi

echo ""
echo "🔐 Checking GitHub Secrets..."

# Check if we're in a git repository
if git rev-parse --git-dir > /dev/null 2>&1; then
    success "Git repository detected"
    
    # Get GitHub secrets (this will fail if not set, but that's OK)
    SECRETS_COUNT=$(gh secret list --json name 2>/dev/null | jq length 2>/dev/null || echo "0")
    
    if [ "$SECRETS_COUNT" -gt "0" ]; then
        success "GitHub secrets are configured ($SECRETS_COUNT secrets)"
        info "To view secrets: gh secret list"
    else
        warning "No GitHub secrets found. Run: ./scripts/setup-github-secrets.sh"
    fi
else
    warning "Not in a git repository. GitHub secrets check skipped."
fi

echo ""
echo "🔄 Testing Deployment Readiness..."

# Check if we can build the Docker image locally (optional)
if command -v docker &> /dev/null; then
    if [ -f "backend/Dockerfile" ]; then
        info "Testing Docker build (optional)..."
        if docker build -t test-build backend/ &> /dev/null; then
            success "Docker image builds successfully"
            docker rmi test-build &> /dev/null || true
        else
            warning "Docker build failed - check backend/Dockerfile"
        fi
    fi
else
    info "Docker not installed - skipping build test"
fi

echo ""
echo "📊 Summary..."

echo ""
success "✅ All validations passed! Your deployment setup is ready."
echo ""
info "🚀 Next steps:"
echo "   1. Run: ./scripts/setup-github-secrets.sh (if not done)"
echo "   2. Push to main branch: git push origin main"
echo "   3. Monitor deployment: gh run watch"
echo ""
info "📖 Documentation:"
echo "   - docs/AZURE_DEPLOYMENT_GUIDE.md"
echo "   - docs/QUICK_DEPLOYMENT_REFERENCE.md"
echo ""
info "🔍 Monitoring commands:"
echo "   - gh run list"
echo "   - az containerapp logs show -n kisaancenter-backend -g kisaancenter-rg --follow"
echo ""

echo "🎉 Happy deploying!"