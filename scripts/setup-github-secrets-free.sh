#!/bin/bash

# GitHub Secrets Setup Script for FREE Tier Architecture
set -e

echo "🔐 Setting up GitHub Secrets for FREE Tier Azure Deployment"
echo "==========================================================="

# Function to check command existence
check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        exit 1
    fi
}

# Function to get terraform output safely with timeout
get_terraform_output() {
    local output_name="$1"
    local value
    value=$(timeout 30 terraform output -raw "$output_name" 2>/dev/null | head -n 1 | tr -d '[:space:]' || echo "")
    if [ -z "$value" ]; then
        >&2 echo "❌ Terraform output '$output_name' not found or timed out"
        return 1
    fi
    >&2 echo "  ✅ Got: $output_name"
    echo "$value"
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

check_command "gh"
check_command "az"
check_command "terraform"

# Check GitHub CLI login
if ! gh auth status &> /dev/null; then
    echo "❌ Please login to GitHub CLI first:"
    echo "   gh auth login"
    exit 1
fi

# Check Azure CLI login
echo "Checking Azure login..."
if ! timeout 10 az account show &> /dev/null; then
    echo "❌ Please login to Azure CLI first:"
    echo "   az login"
    exit 1
fi
echo "✅ Azure CLI logged in"

# Get the script directory and navigate to terraform directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TERRAFORM_DIR="$PROJECT_ROOT/terraform"

echo "📁 Navigating to Terraform directory: $TERRAFORM_DIR"

if [ ! -d "$TERRAFORM_DIR" ]; then
    echo "❌ Terraform directory not found at: $TERRAFORM_DIR"
    echo "Please ensure your terraform files are in the terraform/ directory"
    exit 1
fi

# Change to terraform directory
cd "$TERRAFORM_DIR"

# Check if terraform is initialized and can access remote state
echo "🔍 Checking Terraform state access..."
if ! timeout 15 terraform state list &> /dev/null; then
    echo "❌ Cannot access Terraform state. Please ensure:"
    echo "   1. Terraform is initialized: terraform init"
    echo "   2. You have access to the remote state backend"
    echo "   3. Infrastructure has been deployed: terraform apply"
    echo "   4. Current directory: $(pwd)"
    exit 1
fi
echo "✅ Terraform state accessible"

echo ""
echo "🔍 Getting values from Azure and Terraform..."

# Get Azure subscription info
echo "Getting Azure subscription info..."
AZURE_SUBSCRIPTION_ID=$(timeout 10 az account show --query "id" -o tsv)
AZURE_TENANT_ID=$(timeout 10 az account show --query "tenantId" -o tsv)
echo "✅ Got Azure subscription info"

# Get Terraform outputs (only the ones that exist)
echo "Getting Terraform outputs..."
AZURE_RESOURCE_GROUP=$(get_terraform_output "resource_group_name") || exit 1
BACKEND_APP_NAME=$(get_terraform_output "backend_container_app_name") || exit 1
CONTAINER_ENV_NAME=$(get_terraform_output "container_app_environment_name") || exit 1
KEY_VAULT_NAME=$(get_terraform_output "key_vault_name") || exit 1

# Try to get the backend FQDN - if it exists
set +e  # Don't exit on error for this one
BACKEND_FQDN=$(get_terraform_output "backend_container_app_fqdn" 2>/dev/null)
if [ -z "$BACKEND_FQDN" ]; then
    echo "⚠️  backend_container_app_fqdn not found in outputs"
    echo "🔧 You'll need to get this manually after the Container App is deployed"
    BACKEND_FQDN="<TO_BE_SET_LATER>"
fi
set -e

BACKEND_URL="https://${BACKEND_FQDN}"

echo ""
echo "⚠️  IMPORTANT: Service Principal Setup Required"
echo "==============================================="
echo "Your Terraform doesn't include service principal creation."
echo "You need to create one manually for GitHub Actions:"
echo ""
echo "Run these commands:"
echo "1. Create service principal:"
echo "   az ad sp create-for-rbac --name 'kisaancenter-github-actions' --role contributor --scopes /subscriptions/$AZURE_SUBSCRIPTION_ID/resourceGroups/$AZURE_RESOURCE_GROUP"
echo ""
echo "2. Note down the appId and password from the output"
echo "3. We'll prompt you for them now..."
echo ""

# Prompt for service principal details
read -p "Enter the Service Principal App ID (clientId): " AZURE_CLIENT_ID
read -s -p "Enter the Service Principal Password (clientSecret): " AZURE_CLIENT_SECRET
echo ""

# Get database password from Key Vault
echo "🔑 Getting database password from Key Vault..."
DB_PASSWORD=$(az keyvault secret show --vault-name "$KEY_VAULT_NAME" --name "postgresql-admin-password" --query "value" -o tsv)
if [ -z "$DB_PASSWORD" ]; then
    echo "❌ Could not retrieve database password from Key Vault"
    echo "Please ensure the secret 'postgresql-admin-password' exists in $KEY_VAULT_NAME"
    exit 1
fi
echo "✅ Got database password from Key Vault"

echo "✅ Backend URL: $BACKEND_URL"
echo ""

# Return to project root for GitHub operations
cd "$PROJECT_ROOT"

# Define all secrets
secrets=(
    "AZURE_SUBSCRIPTION_ID:$AZURE_SUBSCRIPTION_ID"
    "AZURE_TENANT_ID:$AZURE_TENANT_ID"
    "AZURE_CLIENT_ID:$AZURE_CLIENT_ID"
    "AZURE_CLIENT_SECRET:$AZURE_CLIENT_SECRET"
    "AZURE_RESOURCE_GROUP:$AZURE_RESOURCE_GROUP"
    "AZURE_CONTAINER_APP_NAME:$BACKEND_APP_NAME"
    "AZURE_CONTAINER_APP_ENVIRONMENT:$CONTAINER_ENV_NAME"
    "DB_PASSWORD:$DB_PASSWORD"
    "KEY_VAULT_NAME:$KEY_VAULT_NAME"
    "VITE_API_BASE_URL:$BACKEND_URL"
)

echo "🔐 Setting GitHub secrets..."
echo ""

# Set each secret
for secret in "${secrets[@]}"; do
    IFS=':' read -r name value <<< "$secret"
    echo "Setting $name..."
    
    if gh secret set "$name" --body "$value"; then
        echo "✅ $name set successfully"
    else
        echo "❌ Failed to set $name"
        exit 1
    fi
done

echo ""
echo "🎉 All GitHub secrets have been set successfully!"
echo ""
echo "📋 Summary of set secrets:"
echo "=========================="

for secret in "${secrets[@]}"; do
    IFS=':' read -r name value <<< "$secret"
    if [[ "$name" == *"SECRET"* ]] || [[ "$name" == *"PASSWORD"* ]]; then
        echo "✅ $name: [HIDDEN]"
    else
        echo "✅ $name: $value"
    fi
done

echo ""
if [ "$BACKEND_FQDN" = "<TO_BE_SET_LATER>" ]; then
    echo "⚠️  NEXT STEPS:"
    echo "1. Deploy your infrastructure: terraform apply"
    echo "2. Get the backend URL: terraform output backend_container_app_fqdn"
    echo "3. Update the VITE_API_BASE_URL secret: gh secret set VITE_API_BASE_URL --body 'https://YOUR_BACKEND_FQDN'"
    echo ""
fi

echo "🚀 You can now:"
echo "1. Push your code to trigger the workflows"
echo "2. Check the Actions tab in GitHub to see the deployments"
echo "3. Your frontend will be available at: https://$(git config --get remote.origin.url | sed 's|.*/||' | sed 's|\.git||').github.io/kisaanCenter"
echo "4. Your backend API will be available at: $BACKEND_URL"
echo ""
echo "✨ Happy deploying!"