# Azure Deployment Guide

## 🚀 Quick Start

### 1. Deploy Infrastructure
```bash
cd terraform
terraform apply
```

### 2. Setup GitHub Secrets
```bash
cd ../scripts
chmod +x setup-github-secrets.sh
./setup-github-secrets.sh
```

### 3. Push to Deploy
```bash
git add .
git commit -m "Setup Azure deployment"
git push origin main
```

## 📋 What Happens Next

1. **GitHub Actions Trigger**: On push to main branch or workflow_dispatch
2. **Build Backend**: Creates Docker image from backend code
3. **Push to ACR**: Uploads image to Azure Container Registry
4. **Deploy**: Updates Container App with new image
5. **Health Check**: Verifies deployment success

## 🔍 Monitoring

### Check Deployment Status
```bash
# View GitHub Actions
gh run list

# Check Container App logs
az containerapp logs show \
  --name kisaancenter-backend \
  --resource-group kisaancenter-rg \
  --follow
```

### Access Backend (Internal)
```bash
# Get Container App internal URL
az containerapp show \
  --name kisaancenter-backend \
  --resource-group kisaancenter-rg \
  --query properties.configuration.ingress.fqdn \
  --output tsv
```

### Database Connection Test
```bash
# Connect to PostgreSQL VM
az vm run-command invoke \
  --resource-group kisaancenter-rg \
  --name kisaancenter-postgresql-vm \
  --command-id RunShellScript \
  --scripts "sudo -u postgres psql -c '\l'"
```

## 🛠️ Troubleshooting

### Common Issues

1. **Image Pull Failed**: Check ACR credentials in GitHub secrets
2. **App Won't Start**: Check environment variables and database connection
3. **Build Failed**: Check Dockerfile and requirements.txt
4. **Service Principal Issues**: Recreate using the setup script

### Useful Commands
```bash
# Restart Container App
az containerapp revision restart \
  --name kisaancenter-backend \
  --resource-group kisaancenter-rg

# Check PostgreSQL VM status
az vm run-command invoke \
  --resource-group kisaancenter-rg \
  --name kisaancenter-postgresql-vm \
  --command-id RunShellScript \
  --scripts "sudo systemctl status postgresql"

# View Container App environment variables
az containerapp show \
  --name kisaancenter-backend \
  --resource-group kisaancenter-rg \
  --query properties.template.containers[0].env
```

## 🔄 Manual Deployment (if needed)

```bash
# Build locally
cd backend
docker build -t kisaancenter-backend .

# Get ACR name from Terraform
cd ../terraform
ACR_NAME=$(terraform output -raw container_registry_name)

# Tag for ACR
docker tag kisaancenter-backend \
  $ACR_NAME.azurecr.io/kisaancenter-backend:latest

# Login and push to ACR
az acr login --name $ACR_NAME
docker push $ACR_NAME.azurecr.io/kisaancenter-backend:latest

# Update Container App
az containerapp update \
  --name kisaancenter-backend \
  --resource-group kisaancenter-rg \
  --image $ACR_NAME.azurecr.io/kisaancenter-backend:latest
```

## 📊 Cost Monitoring

### Check Current Usage
```bash
# Container Apps usage
az monitor metrics list \
  --resource "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/kisaancenter-rg/providers/Microsoft.App/containerApps/kisaancenter-backend" \
  --metric "Requests" \
  --interval PT1H

# PostgreSQL VM usage
az vm show \
  --resource-group kisaancenter-rg \
  --name kisaancenter-postgresql-vm \
  --show-details \
  --query powerState
```

## 🔐 Security

### Key Vault Secrets
```bash
# List all secrets
az keyvault secret list \
  --vault-name $(terraform output -raw key_vault_name) \
  --query [].name

# View secret (admin only)
az keyvault secret show \
  --vault-name $(terraform output -raw key_vault_name) \
  --name postgresql-admin-password
```

### Network Security
- ✅ Backend is internal-only (not internet-exposed)
- ✅ PostgreSQL VM is in private subnet
- ✅ Network Security Group rules restrict access
- ✅ All secrets stored in Azure Key Vault

## 📱 Next Steps: Frontend Deployment

After backend is working, deploy the frontend:

1. **Azure Static Web Apps** for hosting
2. **Custom domain** configuration (kisaancenter.com)
3. **API integration** with backend
4. **DNS setup** with GoDaddy

## 🎯 Deployment Checklist

- [ ] Infrastructure deployed (`terraform apply`)
- [ ] GitHub secrets configured
- [ ] Backend image built and deployed
- [ ] Database connection working
- [ ] Health checks passing
- [ ] Logs showing no errors
- [ ] Ready for frontend integration