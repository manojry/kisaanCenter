#!/bin/bash

# GitHub Secrets Update Script for KisaanCenter
# This script extracts values from Terraform outputs and updates GitHub repository secrets

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
GITHUB_OWNER="manojRY"
GITHUB_REPO="kisaanCenter"
TERRAFORM_DIR="/Users/manojreddy.yalamareddy/kisaanCenter/kisaanCenter/terraform"

echo -e "${BLUE}🔧 GitHub Secrets Update Script for KisaanCenter${NC}"
echo "=================================================="

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed. Please install it first:${NC}"
    echo "   brew install gh"
    echo "   or visit: https://cli.github.com/"
    exit 1
fi

# Check if user is logged in to GitHub CLI
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  You are not logged in to GitHub CLI. Logging in...${NC}"
    gh auth login
fi

# Change to terraform directory
cd "$TERRAFORM_DIR"

# Check if terraform is initialized and can access remote state
echo -e "${BLUE}🔍 Checking Terraform initialization and remote state access...${NC}"
if ! terraform init -backend=true &> /dev/null; then
    echo -e "${RED}❌ Terraform initialization failed. Please run 'terraform init' first.${NC}"
    exit 1
fi

# Test if we can access the remote state by trying to get any output
if ! terraform output resource_group_name &> /dev/null; then
    echo -e "${RED}❌ Cannot access Terraform state. Please ensure:${NC}"
    echo "   1. You are logged in to Azure: az login"
    echo "   2. Terraform backend is properly configured"
    echo "   3. Remote state exists: terraform plan or terraform apply"
    exit 1
fi

echo -e "${GREEN}✅ Remote Terraform state accessible${NC}"

echo -e "${BLUE}📊 Extracting values from Terraform outputs...${NC}"

# Function to extract terraform output
get_tf_output() {
    local output_name="$1"
    timeout 30 terraform output -raw "$output_name" 2>/dev/null || echo ""
}

# Function to update GitHub secret
update_github_secret() {
    local secret_name="$1"
    local secret_value="$2"
    local description="$3"
    
    if [ -z "$secret_value" ]; then
        echo -e "${YELLOW}⚠️  Skipping $secret_name (empty value)${NC}"
        return
    fi
    
    echo -e "${BLUE}🔄 Updating secret: $secret_name${NC}"
    if echo "$secret_value" | gh secret set "$secret_name" --repo="$GITHUB_OWNER/$GITHUB_REPO"; then
        echo -e "${GREEN}✅ Updated: $secret_name${NC}"
    else
        echo -e "${RED}❌ Failed to update: $secret_name${NC}"
    fi
}

# Extract values from Terraform outputs
echo -e "${BLUE}📋 Extracting Terraform output values...${NC}"

RESOURCE_GROUP=$(get_tf_output "resource_group_name")
CONTAINER_APP_NAME=$(get_tf_output "backend_container_app_name")
CONTAINER_APP_ENV=$(get_tf_output "container_app_environment_name")
KEY_VAULT_NAME=$(get_tf_output "key_vault_name")
DB_HOST=$(get_tf_output "postgresql_server_fqdn")
DB_NAME=$(get_tf_output "postgresql_database_name")
DB_USER=$(get_tf_output "postgresql_admin_username")
BASTION_PUBLIC_IP=$(get_tf_output "bastion_host_public_ip")

# Fixed values that don't change
DB_PORT="5432"

echo -e "${GREEN}📋 Extracted Values:${NC}"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Container App: $CONTAINER_APP_NAME"
echo "  Container Environment: $CONTAINER_APP_ENV"
echo "  Key Vault: $KEY_VAULT_NAME"
echo "  DB Host: $DB_HOST"
echo "  DB Name: $DB_NAME"
echo "  DB User: $DB_USER"
echo "  DB Port: $DB_PORT"
echo "  Bastion IP: $BASTION_PUBLIC_IP"

echo ""
echo -e "${BLUE}🔐 Updating GitHub repository secrets...${NC}"

# Update Azure Resource secrets
update_github_secret "AZURE_RESOURCE_GROUP" "$RESOURCE_GROUP" "Azure Resource Group for deployment"
update_github_secret "AZURE_CONTAINER_APP_NAME" "$CONTAINER_APP_NAME" "Azure Container App name"
update_github_secret "AZURE_CONTAINER_APP_ENVIRONMENT" "$CONTAINER_APP_ENV" "Azure Container App Environment"

# Update Key Vault secret
update_github_secret "KEY_VAULT_NAME" "$KEY_VAULT_NAME" "Azure Key Vault name for secrets"

# Update Database connection secrets
update_github_secret "DB_HOST" "$DB_HOST" "PostgreSQL database host"
update_github_secret "DB_PORT" "$DB_PORT" "PostgreSQL database port"
update_github_secret "DB_NAME" "$DB_NAME" "PostgreSQL database name"
update_github_secret "DB_USER" "$DB_USER" "PostgreSQL database username"

# Update Bastion host information (for documentation/debugging)
update_github_secret "BASTION_HOST_IP" "$BASTION_PUBLIC_IP" "Bastion host public IP for database access"

echo ""
echo -e "${GREEN}✅ GitHub secrets update completed!${NC}"
echo ""
echo -e "${YELLOW}📝 Important Notes:${NC}"
echo "1. Database password (DB_PASSWORD) is stored in Azure Key Vault as 'postgresql-admin-password'"
echo "2. Your GitHub Actions workflow should retrieve it using Azure CLI during deployment"
echo "3. Make sure your Azure authentication secrets are still valid:"
echo "   - AZURE_CLIENT_ID"
echo "   - AZURE_CLIENT_SECRET"
echo "   - AZURE_TENANT_ID"
echo "   - AZURE_SUBSCRIPTION_ID"
echo ""
echo -e "${BLUE}🔗 Connection Information:${NC}"
echo "  Bastion Host: ssh -i ~/.ssh/id_rsa azureuser@$BASTION_PUBLIC_IP"
echo "  Database: $DB_HOST:$DB_PORT/$DB_NAME"
echo "  Key Vault: $KEY_VAULT_NAME"

echo ""
echo -e "${GREEN}🎉 All secrets have been updated! Your GitHub Actions should now work with the new infrastructure.${NC}"

# Show current secrets (without values for security)
echo ""
echo -e "${BLUE}📋 Current repository secrets:${NC}"
gh secret list --repo="$GITHUB_OWNER/$GITHUB_REPO"