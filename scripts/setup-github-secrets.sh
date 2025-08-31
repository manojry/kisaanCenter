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

# Function to get terraform output safely
get_terraform_output() {
    local output_name="$1"
    local value
    value=$(terraform output -raw "$output_name" 2>/dev/null || echo "")
    if [ -z "$value" ]; then
        echo "❌ Terraform output '$output_name' not found"
        return 1
    fi
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
if ! az account show &> /dev/null; then
    echo "❌ Please login to Azure CLI first:"
    echo "   az login"
    exit 1
fi

# Navigate to terraform directory
echo "📁 Navigating to terraform directory..."
cd "$(dirname "$0")/../terraform"

# Check terraform initialization
if [ ! -d ".terraform" ]; then
    echo "❌ Terraform not initialized. Please run:"
    echo "   cd terraform && terraform init"
    exit 1
fi

# Check if terraform state is accessible
if ! terraform show &> /dev/null; then
    echo "❌ Cannot access Terraform state. Please ensure:"
    echo "   1. You're logged into Azure: az login"
    echo "   2. Infrastructure is deployed: terraform apply"
    exit 1
fi

echo "✅ Prerequisites check passed!"
echo ""

# Get basic Azure information
echo "🔍 Getting Azure information..."
AZURE_SUBSCRIPTION_ID=$(az account show --query id -o tsv)
AZURE_TENANT_ID=$(az account show --query tenantId -o tsv)
GITHUB_REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)

echo "✅ Azure Subscription: $AZURE_SUBSCRIPTION_ID"
echo "✅ Azure Tenant: $AZURE_TENANT_ID"
echo "✅ GitHub Repository: $GITHUB_REPO"
echo ""

# Get Terraform outputs
echo "🔍 Getting Terraform outputs..."

AZURE_RESOURCE_GROUP=$(get_terraform_output "resource_group_name") || exit 1
KEY_VAULT_NAME=$(get_terraform_output "key_vault_name") || exit 1
BACKEND_APP_NAME=$(get_terraform_output "backend_container_app_name") || exit 1
CONTAINER_ENV_NAME=$(get_terraform_output "container_app_environment_name") || exit 1

echo "✅ Resource Group: $AZURE_RESOURCE_GROUP"
echo "✅ Key Vault: $KEY_VAULT_NAME"
echo "✅ Container App: $BACKEND_APP_NAME"
echo "✅ Container Environment: $CONTAINER_ENV_NAME"
echo ""

# Create Azure Service Principal for GitHub Actions
echo "🔍 Creating/Getting Azure Service Principal..."

# Check if service principal already exists
SP_NAME="github-actions-kisaancenter-free"
EXISTING_SP=$(az ad sp list --display-name "$SP_NAME" --query "[0].appId" -o tsv 2>/dev/null || echo "")

if [ -n "$EXISTING_SP" ]; then
    echo "✅ Using existing Service Principal: $SP_NAME"
    AZURE_CLIENT_ID="$EXISTING_SP"
    
    # Reset credentials
    echo "🔄 Resetting Service Principal credentials..."
    AZURE_CLIENT_SECRET=$(az ad sp credential reset --id "$AZURE_CLIENT_ID" --query password -o tsv)
else
    echo "🔄 Creating new Service Principal: $SP_NAME"
    SP_OUTPUT=$(az ad sp create-for-rbac \
        --name "$SP_NAME" \
        --role contributor \
        --scopes "/subscriptions/${AZURE_SUBSCRIPTION_ID}/resourceGroups/${AZURE_RESOURCE_GROUP}" \
        --query '{clientId: appId, clientSecret: password}' \
        -o json)
    
    AZURE_CLIENT_ID=$(echo "$SP_OUTPUT" | jq -r .clientId)
    AZURE_CLIENT_SECRET=$(echo "$SP_OUTPUT" | jq -r .clientSecret)
fi

echo "✅ Service Principal ID: $AZURE_CLIENT_ID"
echo ""

# Get database password from Key Vault
echo "🔍 Getting database password from Key Vault..."
DB_PASSWORD=$(az keyvault secret show --name postgresql-admin-password --vault-name "$KEY_VAULT_NAME" --query value -o tsv)
echo "✅ Database password retrieved"
echo ""

# Set GitHub secrets
echo "🔐 Setting GitHub Secrets..."

# Set each secret with error handling
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
)

for secret in "${secrets[@]}"; do
    secret_name="${secret%%:*}"
    secret_value="${secret#*:}"
    
    if gh secret set "$secret_name" --body "$secret_value"; then
        echo "✅ Set secret: $secret_name"
    else
        echo "❌ Failed to set secret: $secret_name"
        exit 1
    fi
done

echo ""
echo "🎉 All GitHub secrets have been set successfully!"
echo ""
echo "📋 Set secrets:"
for secret in "${secrets[@]}"; do
    secret_name="${secret%%:*}"
    echo "   ✅ $secret_name"
done
echo ""
echo "🔍 Verify secrets:"
echo "   gh secret list"
echo ""
echo "🚀 Next steps:"
echo "   1. Push backend changes to trigger deployment"
echo "   2. GitHub Actions will build image and deploy to Container Apps"
echo "   3. Check the Actions tab: https://github.com/$GITHUB_REPO/actions"
echo ""
echo "🛠️ Service Principal created: $SP_NAME"
echo "   Manage in: Azure Portal > Azure Active Directory > App registrations"
echo ""
echo "🌐 Your backend will be available at:"
echo "   https://$(get_terraform_output "backend_container_app_fqdn" 2>/dev/null || echo "your-app.region.azurecontainerapps.io")"