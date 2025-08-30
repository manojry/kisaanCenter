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
    storage_account_name = "tfstate9o3t4rqe"  # Replace with actual storage account name from bootstrap output
    container_name       = "tfstate"
    key                  = "kisaancenter/terraform.tfstate"
  }
}

# Configure the Microsoft Azure Provider
provider "azurerm" {
  features {}
}

# Register only the Container Apps provider (others are auto-registered by Terraform)
resource "azurerm_resource_provider_registration" "container_apps" {
  name = "Microsoft.App"
}

# Create a resource group in West Europe region
resource "azurerm_resource_group" "kisaancenter_rg" {
  name     = "kisaancenter-rg"
  location = "West Europe"

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
    CreatedBy   = "Terraform"
    Region      = "WestEurope"
  }
}

# Create a virtual network
resource "azurerm_virtual_network" "kisaancenter_vnet" {
  name                = "kisaancenter-vnet"
  address_space       = ["10.0.0.0/16"]  # Provides 65,534 IP addresses
  location            = azurerm_resource_group.kisaancenter_rg.location
  resource_group_name = azurerm_resource_group.kisaancenter_rg.name

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
    CreatedBy   = "Terraform"
    Region      = "WestEurope"
  }
}

# Create subnet for backend services (Container Apps) - Must be /23 or larger
resource "azurerm_subnet" "backend_subnet" {
  name                 = "backend-subnet"
  resource_group_name  = azurerm_resource_group.kisaancenter_rg.name
  virtual_network_name = azurerm_virtual_network.kisaancenter_vnet.name
  address_prefixes     = ["10.0.0.0/23"]  # 512 IP addresses for Container Apps (required minimum)

  # Note: No delegation needed - Container Apps will handle this automatically
}

# Create subnet for database services
resource "azurerm_subnet" "database_subnet" {
  name                 = "database-subnet"
  resource_group_name  = azurerm_resource_group.kisaancenter_rg.name
  virtual_network_name = azurerm_virtual_network.kisaancenter_vnet.name
  address_prefixes     = ["10.0.2.0/24"]  # 254 IP addresses for database services
}

# Create subnet for future services (optional)
resource "azurerm_subnet" "services_subnet" {
  name                 = "services-subnet"
  resource_group_name  = azurerm_resource_group.kisaancenter_rg.name
  virtual_network_name = azurerm_virtual_network.kisaancenter_vnet.name
  address_prefixes     = ["10.0.3.0/24"]  # 254 IP addresses for additional services
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

# Generate random suffix for unique naming
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

# Generate secure random password for PostgreSQL
resource "random_password" "postgresql_password" {
  length  = 32
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

# Create Network Security Group for PostgreSQL VM
resource "azurerm_network_security_group" "postgresql_nsg" {
  name                = "postgresql-nsg"
  location            = azurerm_resource_group.kisaancenter_rg.location
  resource_group_name = azurerm_resource_group.kisaancenter_rg.name

  # Allow PostgreSQL access from backend subnet only
  security_rule {
    name                       = "PostgreSQL"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "5432"
    source_address_prefix      = "10.0.1.0/24"  # Backend subnet
    destination_address_prefix = "*"
  }

  # Allow SSH for management (optional, can be removed later)
  security_rule {
    name                       = "SSH"
    priority                   = 1002
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "10.0.0.0/16"  # VNet only
    destination_address_prefix = "*"
  }

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
    Purpose     = "Database Security"
  }
}

# Associate NSG with database subnet
resource "azurerm_subnet_network_security_group_association" "postgresql_nsg_association" {
  subnet_id                 = azurerm_subnet.database_subnet.id
  network_security_group_id = azurerm_network_security_group.postgresql_nsg.id
}

# Create Public IP for PostgreSQL VM (for initial setup only)
resource "azurerm_public_ip" "postgresql_vm_pip" {
  name                = "postgresql-vm-pip"
  location            = azurerm_resource_group.kisaancenter_rg.location
  resource_group_name = azurerm_resource_group.kisaancenter_rg.name
  allocation_method   = "Static"
  sku                = "Standard"

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
    Purpose     = "Database VM Management"
  }
}

# Create Network Interface for PostgreSQL VM
resource "azurerm_network_interface" "postgresql_vm_nic" {
  name                = "postgresql-vm-nic"
  location            = azurerm_resource_group.kisaancenter_rg.location
  resource_group_name = azurerm_resource_group.kisaancenter_rg.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.database_subnet.id
    private_ip_address_allocation = "Static"
    private_ip_address           = "10.0.2.10"  # Fixed IP for easy backend connection
    public_ip_address_id         = azurerm_public_ip.postgresql_vm_pip.id
  }

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
    Purpose     = "Database VM Network"
  }
}

# Create Managed Disk for PostgreSQL data
resource "azurerm_managed_disk" "postgresql_data_disk" {
  name                 = "postgresql-data-disk"
  location             = azurerm_resource_group.kisaancenter_rg.location
  resource_group_name  = azurerm_resource_group.kisaancenter_rg.name
  storage_account_type = "Standard_LRS"  # Cheapest option
  create_option        = "Empty"
  disk_size_gb         = 10  # 10GB for database data

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
    Purpose     = "Database Storage"
  }
}

# Create PostgreSQL VM (Free Tier B1s)
resource "azurerm_linux_virtual_machine" "postgresql_vm" {
  name                = "postgresql-vm"
  location            = azurerm_resource_group.kisaancenter_rg.location
  resource_group_name = azurerm_resource_group.kisaancenter_rg.name
  size                = "Standard_B1s"  # Free tier: 1 vCPU, 1GB RAM
  admin_username      = "azureuser"
  
  # Disable password authentication and use SSH keys
  disable_password_authentication = true

  network_interface_ids = [
    azurerm_network_interface.postgresql_vm_nic.id,
  ]

  admin_ssh_key {
    username   = "azureuser"
    public_key = tls_private_key.postgresql_vm_ssh.public_key_openssh
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"  # Cheapest storage
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-focal"
    sku       = "20_04-lts-gen2"
    version   = "latest"
  }

  # PostgreSQL installation and configuration script
  custom_data = base64encode(templatefile("${path.module}/postgresql_setup.sh", {
    postgresql_password = random_password.postgresql_password.result
  }))

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
    Purpose     = "Database Server"
    Tier        = "Free"
  }
}

# Attach data disk to VM
resource "azurerm_virtual_machine_data_disk_attachment" "postgresql_data_attachment" {
  managed_disk_id    = azurerm_managed_disk.postgresql_data_disk.id
  virtual_machine_id = azurerm_linux_virtual_machine.postgresql_vm.id
  lun                = "10"
  caching            = "ReadWrite"
}

# Generate SSH key pair for VM access
resource "tls_private_key" "postgresql_vm_ssh" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

# Store SSH private key in Key Vault
resource "azurerm_key_vault_secret" "postgresql_vm_ssh_private" {
  name         = "postgresql-vm-ssh-private-key"
  value        = tls_private_key.postgresql_vm_ssh.private_key_pem
  key_vault_id = azurerm_key_vault.kisaancenter_kv.id

  depends_on = [azurerm_key_vault.kisaancenter_kv]

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
    Purpose     = "VM Access"
  }
}

# Create Container Registry for storing backend images
resource "azurerm_container_registry" "kisaancenter_acr" {
  name                = "kisaancenteracr${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.kisaancenter_rg.name
  location            = azurerm_resource_group.kisaancenter_rg.location
  sku                 = "Basic"  # Cheapest tier
  admin_enabled       = true     # Enable admin for easy access

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
    Purpose     = "Container Images"
  }
}

# Store ACR admin password in Key Vault
resource "azurerm_key_vault_secret" "acr_admin_password" {
  name         = "acr-admin-password"
  value        = azurerm_container_registry.kisaancenter_acr.admin_password
  key_vault_id = azurerm_key_vault.kisaancenter_kv.id

  depends_on = [azurerm_key_vault.kisaancenter_kv]

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
    Purpose     = "Container Registry Access"
  }
}

# Create Log Analytics Workspace for Container Apps
resource "azurerm_log_analytics_workspace" "container_apps_logs" {
  name                = "kisaancenter-logs"
  location            = azurerm_resource_group.kisaancenter_rg.location
  resource_group_name = azurerm_resource_group.kisaancenter_rg.name
  sku                 = "PerGB2018"
  retention_in_days   = 30  # Minimum retention

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
    Purpose     = "Container Logging"
  }
}

# Create Container Apps Environment
resource "azurerm_container_app_environment" "kisaancenter_env" {
  name                       = "kisaancenter-env"
  location                   = azurerm_resource_group.kisaancenter_rg.location
  resource_group_name        = azurerm_resource_group.kisaancenter_rg.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.container_apps_logs.id
  infrastructure_subnet_id   = azurerm_subnet.backend_subnet.id

  depends_on = [azurerm_resource_provider_registration.container_apps]

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
    Purpose     = "Container Environment"
  }
}

# Create Container App for Backend API
resource "azurerm_container_app" "kisaancenter_backend" {
  name                         = "kisaancenter-backend"
  container_app_environment_id = azurerm_container_app_environment.kisaancenter_env.id
  resource_group_name          = azurerm_resource_group.kisaancenter_rg.name
  revision_mode                = "Single"

  # Container App configuration
  template {
    min_replicas = 0  # Scale to zero when not in use (free tier)
    max_replicas = 1  # Maximum 1 replica for cost control

    container {
      name   = "kisaancenter-api"
      image  = "${azurerm_container_registry.kisaancenter_acr.login_server}/kisaancenter-backend:latest"
      cpu    = 0.25  # 0.25 CPU cores (free tier)
      memory = "0.5Gi"  # 0.5GB memory (free tier)

      # Environment variables for the backend
      env {
        name  = "DB_HOST"
        value = azurerm_network_interface.postgresql_vm_nic.ip_configuration[0].private_ip_address
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
        name        = "SECRET_KEY"
        secret_name = "app-secret-key"
      }

      env {
        name  = "ENVIRONMENT"
        value = "production"
      }

      env {
        name  = "CORS_ORIGINS"
        value = "https://*.azurestaticapps.net,https://kisaancenter.com,https://www.kisaancenter.com"
      }
    }

    # HTTP scaling rule
    http_scale_rule {
      name                = "http-requests"
      concurrent_requests = 10  # Scale up when more than 10 concurrent requests
    }
  }

  # Ingress configuration (internal only for security)
  ingress {
    allow_insecure_connections = false
    external_enabled          = false  # Internal access only
    target_port               = 8000
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  # Registry configuration
  registry {
    server               = azurerm_container_registry.kisaancenter_acr.login_server
    username             = azurerm_container_registry.kisaancenter_acr.admin_username
    password_secret_name = "acr-password"
  }

  # Secrets configuration
  secret {
    name  = "db-password"
    value = random_password.postgresql_password.result
  }

  secret {
    name  = "app-secret-key"
    value = random_password.app_secret_key.result
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.kisaancenter_acr.admin_password
  }

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
    Purpose     = "Backend API"
    Tier        = "Free"
  }

  # Allow GitHub Actions to update the image without Terraform conflicts
  lifecycle {
    ignore_changes = [
      template[0].container[0].image,  # Allow CI/CD to update the image
    ]
  }
}

# Generate application secret key
resource "random_password" "app_secret_key" {
  length  = 64
  special = true
  upper   = true
  lower   = true
  numeric = true
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

# Output the resource group details
output "resource_group_name" {
  value = azurerm_resource_group.kisaancenter_rg.name
}

output "resource_group_location" {
  value = azurerm_resource_group.kisaancenter_rg.location
}

output "resource_group_id" {
  value = azurerm_resource_group.kisaancenter_rg.id
}

# Output the virtual network details
output "virtual_network_name" {
  value = azurerm_virtual_network.kisaancenter_vnet.name
}

output "virtual_network_id" {
  value = azurerm_virtual_network.kisaancenter_vnet.id
}

output "virtual_network_address_space" {
  value = azurerm_virtual_network.kisaancenter_vnet.address_space
}

output "backend_subnet_id" {
  value = azurerm_subnet.backend_subnet.id
}

output "database_subnet_id" {
  value = azurerm_subnet.database_subnet.id
}

output "services_subnet_id" {
  value = azurerm_subnet.services_subnet.id
}

# Output the Key Vault details
output "key_vault_name" {
  value = azurerm_key_vault.kisaancenter_kv.name
}

output "key_vault_uri" {
  value = azurerm_key_vault.kisaancenter_kv.vault_uri
}

# Output the PostgreSQL server details (NO PASSWORD)
output "postgresql_vm_name" {
  value = azurerm_linux_virtual_machine.postgresql_vm.name
}

output "postgresql_vm_private_ip" {
  value = azurerm_network_interface.postgresql_vm_nic.ip_configuration[0].private_ip_address
}

output "postgresql_vm_public_ip" {
  value = azurerm_public_ip.postgresql_vm_pip.ip_address
}

output "postgresql_database_name" {
  value = "kisaancenter"
}

output "postgresql_admin_username" {
  value = "postgres"
}

output "postgresql_connection_info" {
  value = {
    host     = azurerm_network_interface.postgresql_vm_nic.ip_configuration[0].private_ip_address
    port     = 5432
    database = "kisaancenter"
    username = "postgres"
    password_secret_name = azurerm_key_vault_secret.postgresql_password.name
    key_vault_name = azurerm_key_vault.kisaancenter_kv.name
    ssh_username = "azureuser"
    ssh_private_key_secret = azurerm_key_vault_secret.postgresql_vm_ssh_private.name
  }
  description = "PostgreSQL connection information (password and SSH key stored in Key Vault)"
}

# Output Container Registry details
output "container_registry_name" {
  value = azurerm_container_registry.kisaancenter_acr.name
}

output "container_registry_login_server" {
  value = azurerm_container_registry.kisaancenter_acr.login_server
}

output "container_registry_admin_username" {
  value = azurerm_container_registry.kisaancenter_acr.admin_username
}

# Output Container Apps details
output "container_app_environment_name" {
  value = azurerm_container_app_environment.kisaancenter_env.name
}

output "backend_container_app_name" {
  value = azurerm_container_app.kisaancenter_backend.name
}

output "backend_container_app_url" {
  value = "https://${azurerm_container_app.kisaancenter_backend.latest_revision_fqdn}"
  description = "Internal URL for the backend API (accessible only from within Azure network)"
}

# Output deployment information
output "deployment_info" {
  value = {
    container_registry = {
      name         = azurerm_container_registry.kisaancenter_acr.name
      login_server = azurerm_container_registry.kisaancenter_acr.login_server
      username     = azurerm_container_registry.kisaancenter_acr.admin_username
      password_secret = "acr-admin-password"
    }
    backend_api = {
      name = azurerm_container_app.kisaancenter_backend.name
      url  = "https://${azurerm_container_app.kisaancenter_backend.latest_revision_fqdn}"
      environment = azurerm_container_app_environment.kisaancenter_env.name
    }
    database = {
      host = azurerm_network_interface.postgresql_vm_nic.ip_configuration[0].private_ip_address
      port = 5432
      name = "kisaancenter"
    }
  }
  description = "Complete deployment information for the KisaanCenter application"
}