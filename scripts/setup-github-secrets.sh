#!/bin/bash

# GitHub Secrets Setup Scri# Get Terraform outputs
echo "📋 Getting Azure resource information from Terraform..."

# Check if we're in the right directory structure
if [ ! -d "terraform" ]; then
    echo "❌ terraform directory not found. Please run this script from the project root."
    exit 1
fi

# Change to terraform directory
cd terraform

# Check if Terraform is initialized with remote state
if [ ! -d ".terraform" ]; then
    echo "❌ Terraform not initialized. Please run 'terraform init' first."
    exit 1
fi

# Try to get outputs from remote state
if ! terraform output &> /dev/null; then
    echo "❌ Cannot access Terraform outputs. Please ensure:"
    echo "   1. You're logged into Azure: az login"
    echo "   2. Terraform is initialized: terraform init"
    echo "   3. Infrastructure is deployed: terraform apply"
    exit 1
fiAzure Deployment
# This script helps you set up all required GitHub secrets for CI/CD

set -e

echo "� Setting up GitHub Secrets for Azure Deployment"
echo "================================================"

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI is not installed. Please install it first:"
    echo "   https://cli.github.com/"
    exit 1
fi

# Check if user is logged in to GitHub CLI
if ! gh auth status &> /dev/null; then
    echo "❌ Please login to GitHub CLI first:"
    echo "   gh auth login"
    exit 1
fi

# Check if Azure CLI is installed and logged in
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first:"
    echo "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

if ! az account show &> /dev/null; then
    echo "❌ Please login to Azure CLI first:"
    echo "   az login"
    exit 1
fi

# Navigate to terraform directory
cd "$(dirname "$0")/../terraform"

# Get Terraform outputs
echo "� Getting Azure resource information from Terraform..."

if [ ! -f "terraform.tfstate" ]; then
    echo "❌ terraform.tfstate not found. Please run 'terraform apply' first."
    exit 1
fi

# Extract values from Terraform outputs
AZURE_SUBSCRIPTION_ID=$(az account show --query id -o tsv)
AZURE_TENANT_ID=$(az account show --query tenantId -o tsv)
AZURE_RESOURCE_GROUP="kisaancenter-rg"
AZURE_CONTAINER_REGISTRY=$(terraform output -raw container_registry_name 2>/dev/null || echo "")
AZURE_CONTAINER_APP_NAME="kisaancenter-backend"
AZURE_CONTAINER_APP_ENVIRONMENT="kisaancenter-env"

# Get ACR credentials
if [ -n "$AZURE_CONTAINER_REGISTRY" ]; then
    AZURE_REGISTRY_USERNAME=$(az acr credential show --name $AZURE_CONTAINER_REGISTRY --query username -o tsv)
    AZURE_REGISTRY_PASSWORD=$(az acr credential show --name $AZURE_CONTAINER_REGISTRY --query passwords[0].value -o tsv)
    AZURE_REGISTRY_LOGIN_SERVER="${AZURE_CONTAINER_REGISTRY}.azurecr.io"
else
    echo "❌ Container registry not found in Terraform outputs"
    exit 1
fi

# Create Azure Service Principal for GitHub Actions
echo "� Creating Azure Service Principal for GitHub Actions..."
GITHUB_REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)

# Create service principal
SP_OUTPUT=$(az ad sp create-for-rbac \
    --name "github-actions-${AZURE_CONTAINER_REGISTRY}" \
    --role contributor \
    --scopes "/subscriptions/${AZURE_SUBSCRIPTION_ID}/resourceGroups/${AZURE_RESOURCE_GROUP}" \
    --sdk-auth)

AZURE_CLIENT_ID=$(echo $SP_OUTPUT | jq -r .clientId)
AZURE_CLIENT_SECRET=$(echo $SP_OUTPUT | jq -r .clientSecret)

# Get database password from Key Vault
KEY_VAULT_NAME=$(terraform output -raw key_vault_name 2>/dev/null || echo "")
if [ -n "$KEY_VAULT_NAME" ]; then
    DB_PASSWORD=$(az keyvault secret show --name postgresql-admin-password --vault-name $KEY_VAULT_NAME --query value -o tsv)
else
    echo "❌ Key Vault not found in Terraform outputs"
    exit 1
fi

# Go back to project root
cd ..

echo "✅ Retrieved Azure resource information"
echo ""
echo "� Setting GitHub Secrets..."

# Navigate back to root directory
cd ..

# Set GitHub secrets
gh secret set AZURE_SUBSCRIPTION_ID --body "$AZURE_SUBSCRIPTION_ID"
gh secret set AZURE_TENANT_ID --body "$AZURE_TENANT_ID"
gh secret set AZURE_CLIENT_ID --body "$AZURE_CLIENT_ID"
gh secret set AZURE_CLIENT_SECRET --body "$AZURE_CLIENT_SECRET"
gh secret set AZURE_RESOURCE_GROUP --body "$AZURE_RESOURCE_GROUP"
gh secret set AZURE_CONTAINER_REGISTRY --body "$AZURE_CONTAINER_REGISTRY"
gh secret set AZURE_REGISTRY_USERNAME --body "$AZURE_REGISTRY_USERNAME"
gh secret set AZURE_REGISTRY_PASSWORD --body "$AZURE_REGISTRY_PASSWORD"
gh secret set AZURE_REGISTRY_LOGIN_SERVER --body "$AZURE_REGISTRY_LOGIN_SERVER"
gh secret set AZURE_CONTAINER_APP_NAME --body "$AZURE_CONTAINER_APP_NAME"
gh secret set AZURE_CONTAINER_APP_ENVIRONMENT --body "$AZURE_CONTAINER_APP_ENVIRONMENT"
gh secret set DB_PASSWORD --body "$DB_PASSWORD"

echo "✅ All GitHub secrets have been set successfully!"
echo ""
echo "🚀 You can now push to main branch to trigger deployment"
echo ""
echo "📋 Set secrets:"
echo "   - AZURE_SUBSCRIPTION_ID"
echo "   - AZURE_TENANT_ID"
echo "   - AZURE_CLIENT_ID"
echo "   - AZURE_CLIENT_SECRET"
echo "   - AZURE_RESOURCE_GROUP"
echo "   - AZURE_CONTAINER_REGISTRY"
echo "   - AZURE_REGISTRY_USERNAME"
echo "   - AZURE_REGISTRY_PASSWORD"
echo "   - AZURE_REGISTRY_LOGIN_SERVER"
echo "   - AZURE_CONTAINER_APP_NAME"
echo "   - AZURE_CONTAINER_APP_ENVIRONMENT"
echo "   - DB_PASSWORD"
echo ""
echo "� Next steps:"
echo "   1. Commit and push your code to main branch"
echo "   2. GitHub Actions will automatically build and deploy"
echo "   3. Check the Actions tab in your GitHub repository"
echo ""
echo "� Service Principal created: github-actions-${AZURE_CONTAINER_REGISTRY}"
echo "   You can manage this in Azure Portal > Azure Active Directory > App registrations"