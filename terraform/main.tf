# Configure the Azure Provider with Remote State Backend
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~>3.1"
    }
  }
  
  # Remote state configuration - Replace with actual values after running bootstrap
  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "tfstate8czoh4wg"  # Replace with actual storage account name from bootstrap output
    container_name       = "tfstate"
    key                  = "terraform.tfstate"
  }
}

# Configure the Microsoft Azure Provider
provider "azurerm" {
  features {}
}

# Generate random suffix for unique naming
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

# Create Resource Group in North Europe (better PostgreSQL availability)
resource "azurerm_resource_group" "kisaancenter_rg" {
  name     = "kisaancenter-rg"
  location = "North Europe"  # Better for PostgreSQL Flexible Server free tier

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
    CostModel   = "FreeTier"
    CreatedBy   = "Terraform"
  }
}

# Create a virtual network
resource "azurerm_virtual_network" "kisaancenter_vnet" {
  name                = "kisaancenter-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.kisaancenter_rg.location
  resource_group_name = azurerm_resource_group.kisaancenter_rg.name

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
    CreatedBy   = "Terraform"
  }
}

# Create subnet for Container Apps (must be /23 or larger)
resource "azurerm_subnet" "container_subnet" {
  name                 = "container-subnet"
  resource_group_name  = azurerm_resource_group.kisaancenter_rg.name
  virtual_network_name = azurerm_virtual_network.kisaancenter_vnet.name
  address_prefixes     = ["10.0.0.0/23"]  # 512 IP addresses for Container Apps

  # Container Apps will automatically delegate this subnet
}

# Create subnet for PostgreSQL Flexible Server
resource "azurerm_subnet" "database_subnet" {
  name                 = "database-subnet"
  resource_group_name  = azurerm_resource_group.kisaancenter_rg.name
  virtual_network_name = azurerm_virtual_network.kisaancenter_vnet.name
  address_prefixes     = ["10.0.2.0/24"]

  delegation {
    name = "postgresql-delegation"
    service_delegation {
      name = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/join/action",
      ]
    }
  }
}

# Get current Azure client configuration
data "azurerm_client_config" "current" {}

# Create Azure Key Vault for storing secrets
resource "azurerm_key_vault" "kisaancenter_kv" {
  name                = "kisaancenter-kv-${random_string.suffix.result}"
  location            = azurerm_resource_group.kisaancenter_rg.location
  resource_group_name = azurerm_resource_group.kisaancenter_rg.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"

  # Enable purge protection and soft delete
  purge_protection_enabled   = false  # Allow purging for development
  soft_delete_retention_days = 7

  # Access policy for current user/service principal
  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    secret_permissions = [
      "Get",
      "List",
      "Set",
      "Delete",
      "Recover",
      "Backup",
      "Restore",
      "Purge"  # Add purge permission
    ]
  }

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
    CreatedBy   = "Terraform"
    Purpose     = "Secrets Management"
  }
}

# Generate secure random password for PostgreSQL
resource "random_password" "postgresql_password" {
  length  = 32
  special = true
  upper   = true
  lower   = true
  numeric = true
}

# Generate application secret key
resource "random_password" "app_secret_key" {
  length  = 64
  special = true
  upper   = true
  lower   = true
  numeric = true
}

# Store PostgreSQL password in Key Vault
resource "azurerm_key_vault_secret" "postgresql_password" {
  name         = "postgresql-admin-password"
  value        = random_password.postgresql_password.result
  key_vault_id = azurerm_key_vault.kisaancenter_kv.id

  depends_on = [azurerm_key_vault.kisaancenter_kv]

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
    Purpose     = "Database Authentication"
  }
}

# Store application secret key in Key Vault
resource "azurerm_key_vault_secret" "app_secret_key" {
  name         = "app-secret-key"
  value        = random_password.app_secret_key.result
  key_vault_id = azurerm_key_vault.kisaancenter_kv.id

  depends_on = [azurerm_key_vault.kisaancenter_kv]

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
    Purpose     = "Application Security"
  }
}

# Private DNS Zone for PostgreSQL
resource "azurerm_private_dns_zone" "postgresql_dns" {
  name                = "kisaancenter.postgres.database.azure.com"
  resource_group_name = azurerm_resource_group.kisaancenter_rg.name

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
  }
}

# Link DNS zone to virtual network
resource "azurerm_private_dns_zone_virtual_network_link" "postgresql_dns_link" {
  name                  = "kisaancenter-db-dns-link"
  private_dns_zone_name = azurerm_private_dns_zone.postgresql_dns.name
  virtual_network_id    = azurerm_virtual_network.kisaancenter_vnet.id
  resource_group_name   = azurerm_resource_group.kisaancenter_rg.name
  registration_enabled  = false

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
  }
}

# PostgreSQL Flexible Server (FREE for 12 months - 750 hours)
resource "azurerm_postgresql_flexible_server" "kisaancenter_db" {
  name                = "kisaancenter-db-${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.kisaancenter_rg.name
  location            = azurerm_resource_group.kisaancenter_rg.location

  administrator_login    = "postgres"
  administrator_password = azurerm_key_vault_secret.postgresql_password.value

  # FREE tier configuration
  sku_name   = "B_Standard_B1ms"  # Burstable B1ms (FREE for 12 months)
  storage_mb = 32768              # 32GB storage (FREE included)
  version    = "15"

  # Network configuration
  public_network_access_enabled = false
  delegated_subnet_id           = azurerm_subnet.database_subnet.id
  private_dns_zone_id          = azurerm_private_dns_zone.postgresql_dns.id

  # Backup configuration (optimize for cost)
  backup_retention_days        = 7    # Minimum retention
  geo_redundant_backup_enabled = false # Disable for cost savings

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
    Tier        = "FreeTier"
    Purpose     = "Database"
  }

  # Ignore zone changes to prevent recreation
  lifecycle {
    ignore_changes = [zone]
  }

  depends_on = [azurerm_private_dns_zone_virtual_network_link.postgresql_dns_link]
}

# Create database
resource "azurerm_postgresql_flexible_server_database" "kisaancenter_database" {
  name      = "kisaancenter"
  server_id = azurerm_postgresql_flexible_server.kisaancenter_db.id
  collation = "en_US.utf8"
  charset   = "utf8"
}

# Log Analytics Workspace for Container Apps (FREE tier)
resource "azurerm_log_analytics_workspace" "kisaancenter_logs" {
  name                = "kisaancenter-logs-${random_string.suffix.result}"
  location            = azurerm_resource_group.kisaancenter_rg.location
  resource_group_name = azurerm_resource_group.kisaancenter_rg.name
  sku                 = "PerGB2018"  # Pay-per-GB (very low cost for small apps)
  retention_in_days   = 30          # Minimum retention for cost savings

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
    Purpose     = "Monitoring"
  }
}

# Container Apps Environment (FREE tier - 180,000 vCPU-seconds monthly)
resource "azurerm_container_app_environment" "kisaancenter_env" {
  name                       = "kisaancenter-env"
  location                   = azurerm_resource_group.kisaancenter_rg.location
  resource_group_name        = azurerm_resource_group.kisaancenter_rg.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.kisaancenter_logs.id

  # Use the container subnet
  infrastructure_subnet_id = azurerm_subnet.container_subnet.id

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
    Tier        = "FreeTier"
  }
}

# Container App for Backend API (using GitHub Container Registry)
resource "azurerm_container_app" "kisaancenter_backend" {
  name                         = "kisaancenter-backend"
  container_app_environment_id = azurerm_container_app_environment.kisaancenter_env.id
  resource_group_name          = azurerm_resource_group.kisaancenter_rg.name
  revision_mode                = "Single"

  template {
    min_replicas = 0  # Scale to zero when not in use (FREE tier optimization)
    max_replicas = 2  # Maximum 2 replicas for availability

    container {
      name   = "kisaancenter-api"
      image  = "ghcr.io/manojry/kisaancenter/backend:latest"  # GitHub Container Registry
      cpu    = 0.25    # 0.25 CPU cores (FREE tier)
      memory = "0.5Gi"  # 0.5GB memory (FREE tier)

      # Environment variables for the Node.js backend
      env {
        name  = "DB_HOST"
        value = azurerm_postgresql_flexible_server.kisaancenter_db.fqdn
      }

      env {
        name  = "DB_PORT"
        value = "5432"
      }

      env {
        name  = "DB_NAME"
        value = "kisaancenter"
      }

      env {
        name  = "DB_USER"
        value = "postgres"
      }

      env {
        name        = "DB_PASSWORD"
        secret_name = "db-password"
      }

      env {
        name  = "DB_DIALECT"
        value = "postgres"
      }

      env {
        name  = "DB_SSL_MODE"
        value = "require"
      }

      env {
        name        = "SECRET_KEY"
        secret_name = "app-secret-key"
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "PORT"
        value = "3000"
      }

      env {
        name  = "CORS_ORIGINS"
        value = "https://kisaancenter.com,https://www.kisaancenter.com,https://manojry.github.io"
      }

      env {
        name  = "DEBUG"
        value = "false"
      }
    }

    # HTTP scaling rule
    http_scale_rule {
      name                = "http-requests"
      concurrent_requests = 10  # Scale up when more than 10 concurrent requests
    }
  }

  # Ingress configuration - EXTERNAL for frontend access
  ingress {
    allow_insecure_connections = false
    external_enabled          = true   # Allow external access from frontend
    target_port               = 3000   # Node.js backend port
    transport                 = "http"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  # Secrets configuration
  secret {
    name  = "db-password"
    value = azurerm_key_vault_secret.postgresql_password.value
  }

  secret {
    name  = "app-secret-key"
    value = azurerm_key_vault_secret.app_secret_key.value
  }

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
    Purpose     = "Backend API"
    Tier        = "FreeTier"
  }

  # Allow GitHub Actions to update the image without Terraform conflicts
  lifecycle {
    ignore_changes = [
      template[0].container[0].image,  # Allow CI/CD to update the image
    ]
  }
}

# ===============================================
# OUTPUTS
# ===============================================

# Output the resource group details
output "resource_group_name" {
  value = azurerm_resource_group.kisaancenter_rg.name
}

output "resource_group_location" {
  value = azurerm_resource_group.kisaancenter_rg.location
}

# Output the Key Vault details
output "key_vault_name" {
  value = azurerm_key_vault.kisaancenter_kv.name
}

output "key_vault_uri" {
  value = azurerm_key_vault.kisaancenter_kv.vault_uri
}

# Output the PostgreSQL server details (NO PASSWORD)
output "postgresql_server_name" {
  value = azurerm_postgresql_flexible_server.kisaancenter_db.name
}

output "postgresql_server_fqdn" {
  value = azurerm_postgresql_flexible_server.kisaancenter_db.fqdn
}

output "postgresql_database_name" {
  value = azurerm_postgresql_flexible_server_database.kisaancenter_database.name
}

output "postgresql_admin_username" {
  value = "postgres"
}

# Output Container Apps details
output "container_app_environment_name" {
  value = azurerm_container_app_environment.kisaancenter_env.name
}

output "backend_container_app_name" {
  value = azurerm_container_app.kisaancenter_backend.name
}

output "backend_container_app_fqdn" {
  value = azurerm_container_app.kisaancenter_backend.latest_revision_fqdn
  description = "FQDN for the backend API (accessible from frontend)"
}

output "backend_container_app_url" {
  value = "https://${azurerm_container_app.kisaancenter_backend.latest_revision_fqdn}"
  description = "Complete URL for the backend API"
}

# Output deployment information for GitHub Actions
output "deployment_info" {
  value = {
    backend_api = {
      name = azurerm_container_app.kisaancenter_backend.name
      fqdn = azurerm_container_app.kisaancenter_backend.latest_revision_fqdn
      url  = "https://${azurerm_container_app.kisaancenter_backend.latest_revision_fqdn}"
      environment = azurerm_container_app_environment.kisaancenter_env.name
      resource_group = azurerm_resource_group.kisaancenter_rg.name
    }
    database = {
      server_name = azurerm_postgresql_flexible_server.kisaancenter_db.name
      fqdn = azurerm_postgresql_flexible_server.kisaancenter_db.fqdn
      database_name = azurerm_postgresql_flexible_server_database.kisaancenter_database.name
      username = "postgres"
    }
    secrets = {
      key_vault_name = azurerm_key_vault.kisaancenter_kv.name
      db_password_secret = azurerm_key_vault_secret.postgresql_password.name
      app_secret_key = azurerm_key_vault_secret.app_secret_key.name
    }
  }
  description = "Complete deployment information for the FREE tier KisaanCenter application"
}

# Output cost summary
output "cost_summary" {
  value = {
    postgresql_flexible_server = "FREE for 12 months (B1ms + 32GB storage)"
    container_apps = "FREE tier (180,000 vCPU-seconds monthly)"
    log_analytics = "Pay-per-GB (~€0.10/month for small usage)"
    key_vault = "~€0.03/month"
    virtual_network = "FREE"
    dns_zone = "~€0.45/month"
    estimated_monthly_cost = "~€0.60/month"
    after_12_months = "~€15-20/month (when PostgreSQL free tier expires)"
  }
  description = "Cost breakdown for the FREE tier architecture"
}