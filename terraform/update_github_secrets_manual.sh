#!/bin/bash

# GitHub Secrets Update Script for KisaanCenter (Manual Values)
# This script uses the extracted Terraform output values to update GitHub repository secrets

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

echo -e "${BLUE}🔧 GitHub Secrets Update Script for KisaanCenter (Manual Values)${NC}"
echo "=================================================================="

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

# ===============================================
# EXTRACTED VALUES FROM TERRAFORM OUTPUT
# ===============================================

echo -e "${BLUE}📋 Using Terraform output values...${NC}"

# Values extracted from your Terraform outputs
RESOURCE_GROUP="kisaancenter-rg"
CONTAINER_APP_NAME="kisaancenter-backend"
CONTAINER_APP_ENV="kisaancenter-env"
KEY_VAULT_NAME="kisaancenter-kv-zppisc"
DB_HOST="kisaancenter-db-zppisc.postgres.database.azure.com"
DB_NAME="kisaancenter"
DB_USER="postgres"
DB_PORT="5432"
BASTION_PUBLIC_IP="40.69.43.21"

# Additional values that might be useful
BACKEND_FQDN="kisaancenter-backend--u335arc.whiteisland-e1233153.northeurope.azurecontainerapps.io"
BACKEND_URL="https://kisaancenter-backend--u335arc.whiteisland-e1233153.northeurope.azurecontainerapps.io"
DB_PASSWORD_SECRET_NAME="postgresql-admin-password"

echo -e "${GREEN}📋 Values to be set:${NC}"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Container App: $CONTAINER_APP_NAME"
echo "  Container Environment: $CONTAINER_APP_ENV"
echo "  Key Vault: $KEY_VAULT_NAME"
echo "  DB Host: $DB_HOST"
echo "  DB Name: $DB_NAME"
echo "  DB User: $DB_USER"
echo "  DB Port: $DB_PORT"
echo "  Bastion IP: $BASTION_PUBLIC_IP"
echo "  Backend FQDN: $BACKEND_FQDN"
echo "  Backend URL: $BACKEND_URL"

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
update_github_secret "DB_PASSWORD_SECRET_NAME" "$DB_PASSWORD_SECRET_NAME" "Key Vault secret name for DB password"

# Update deployment information
update_github_secret "BACKEND_FQDN" "$BACKEND_FQDN" "Backend Container App FQDN"
update_github_secret "BACKEND_URL" "$BACKEND_URL" "Backend Container App URL"

# Update Bastion host information (for documentation/debugging)
update_github_secret "BASTION_HOST_IP" "$BASTION_PUBLIC_IP" "Bastion host public IP for database access"

echo ""
echo -e "${GREEN}✅ GitHub secrets update completed!${NC}"
echo ""
echo -e "${YELLOW}📝 Important Notes:${NC}"
echo "1. Database password is stored in Azure Key Vault as '$DB_PASSWORD_SECRET_NAME'"
echo "2. Your GitHub Actions workflow should retrieve it using Azure CLI during deployment:"
echo "   DB_PASSWORD=\$(az keyvault secret show --vault-name $KEY_VAULT_NAME --name $DB_PASSWORD_SECRET_NAME --query value -o tsv)"
echo "3. Make sure your Azure authentication secrets are still valid:"
echo "   - AZURE_CLIENT_ID"
echo "   - AZURE_CLIENT_SECRET"
echo "   - AZURE_TENANT_ID"
echo "   - AZURE_SUBSCRIPTION_ID"
echo ""
echo -e "${BLUE}🔗 Connection Information:${NC}"
echo "  Bastion Host: ssh -i ~/.ssh/id_rsa azureuser@$BASTION_PUBLIC_IP"
echo "  Database: $DB_HOST:$DB_PORT/$DB_NAME"
echo "  Backend API: $BACKEND_URL"
echo "  Key Vault: $KEY_VAULT_NAME"

echo ""
echo -e "${GREEN}🎉 All secrets have been updated! Your GitHub Actions should now work with the new infrastructure.${NC}"

# Show current secrets (without values for security)
echo ""
echo -e "${BLUE}📋 Current repository secrets:${NC}"
gh secret list --repo="$GITHUB_OWNER/$GITHUB_REPO"

echo ""
echo -e "${BLUE}💡 Next Steps:${NC}"
echo "1. Verify your Azure authentication secrets (AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, etc.)"
echo "2. Update your GitHub Actions workflow to use these new secret names"
echo "3. Test deployment to ensure everything works"
echo ""
echo -e "${YELLOW}🔧 Sample GitHub Actions workflow step for database password:${NC}"
echo ""
echo "      - name: Get DB Password from Key Vault"
echo "        run: |"
echo "          DB_PASSWORD=\$(az keyvault secret show --vault-name \${{ secrets.KEY_VAULT_NAME }} --name \${{ secrets.DB_PASSWORD_SECRET_NAME }} --query value -o tsv)"
echo "          echo \"DB_PASSWORD=\$DB_PASSWORD\" >> \$GITHUB_ENV"