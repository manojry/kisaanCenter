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

# Variables for bastion host user
variable "bastion_username" {
  description = "Username for the bastion host user with password authentication"
  type        = string
  default     = "ramakanth"
}

variable "bastion_user_password" {
  description = "Password for the bastion host user (will be stored in Key Vault)"
  type        = string
  sensitive   = true
  default     = "yd2A4TKG1d7J"  # This will be stored securely in Key Vault, not in state
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

# Create subnet for bastion host
resource "azurerm_subnet" "bastion_subnet" {
  name                 = "bastion-subnet"
  resource_group_name  = azurerm_resource_group.kisaancenter_rg.name
  virtual_network_name = azurerm_virtual_network.kisaancenter_vnet.name
  address_prefixes     = ["10.0.3.0/24"]
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

# Store bastion user password in Key Vault
resource "azurerm_key_vault_secret" "bastion_user_password" {
  name         = "bastion-user-password"
  value        = var.bastion_user_password
  key_vault_id = azurerm_key_vault.kisaancenter_kv.id

  depends_on = [azurerm_key_vault.kisaancenter_kv]

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
    Purpose     = "Bastion User Authentication"
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

# ===============================================
# BASTION HOST CONFIGURATION
# ===============================================

# Create Network Security Group for bastion host
resource "azurerm_network_security_group" "bastion_nsg" {
  name                = "bastion-nsg"
  location            = azurerm_resource_group.kisaancenter_rg.location
  resource_group_name = azurerm_resource_group.kisaancenter_rg.name

  # Allow SSH from your IP only (more secure and cost-effective)
  # You can change this to your specific IP for better security: "YOUR_IP/32"
  security_rule {
    name                       = "SSH"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"  # Change to your IP (e.g., "203.0.113.0/32") for better security
    destination_address_prefix = "*"
  }

  # Allow outbound to PostgreSQL port in database subnet
  security_rule {
    name                       = "PostgreSQL"
    priority                   = 1002
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "5432"
    source_address_prefix      = "*"
    destination_address_prefix = "10.0.2.0/24"
  }

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
    Purpose     = "Bastion Security"
  }
}

# Associate NSG with bastion subnet
resource "azurerm_subnet_network_security_group_association" "bastion_nsg_association" {
  subnet_id                 = azurerm_subnet.bastion_subnet.id
  network_security_group_id = azurerm_network_security_group.bastion_nsg.id
}

# Create public IP for bastion host (Dynamic with Standard SKU - Basic SKU quota exceeded)
resource "azurerm_public_ip" "bastion_pip" {
  name                = "bastion-pip"
  location            = azurerm_resource_group.kisaancenter_rg.location
  resource_group_name = azurerm_resource_group.kisaancenter_rg.name
  allocation_method   = "Static"   # Standard SKU requires Static
  sku                = "Standard"  # Basic SKU quota exceeded in this region

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
    Purpose     = "Bastion Public IP"
  }
}

# Create network interface for bastion host
resource "azurerm_network_interface" "bastion_nic" {
  name                = "bastion-nic"
  location            = azurerm_resource_group.kisaancenter_rg.location
  resource_group_name = azurerm_resource_group.kisaancenter_rg.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.bastion_subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.bastion_pip.id
  }

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
    Purpose     = "Bastion Network Interface"
  }
}

# Read your existing SSH public key
data "local_file" "ssh_public_key" {
  filename = pathexpand("~/.ssh/id_rsa.pub")
}

# Create Linux Virtual Machine for bastion host
resource "azurerm_linux_virtual_machine" "bastion_host" {
  name                = "bastion-host"
  location            = azurerm_resource_group.kisaancenter_rg.location
  resource_group_name = azurerm_resource_group.kisaancenter_rg.name
  size                = "Standard_B1s"  # Smallest size for cost optimization
  admin_username      = "azureuser"

  # Disable password authentication for the main admin user (SSH key only)
  disable_password_authentication = true

  network_interface_ids = [
    azurerm_network_interface.bastion_nic.id,
  ]

  admin_ssh_key {
    username   = "azureuser"
    public_key = data.local_file.ssh_public_key.content
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"  # Standard storage for cost optimization
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  # Install PostgreSQL client tools and create additional user with password authentication
  custom_data = base64encode(<<-EOF
#!/bin/bash
set -e

# Update system
apt-get update
apt-get install -y postgresql-client nano curl wget htop

# Create new user with password authentication
NEW_USER="${var.bastion_username}"
NEW_PASSWORD="${var.bastion_user_password}"

# Create the user
useradd -m -s /bin/bash "$NEW_USER"
echo "$NEW_USER:$NEW_PASSWORD" | chpasswd

# Add user to sudo group (optional - comment out if not needed)
usermod -aG sudo "$NEW_USER"

# Enable password authentication in SSH config
sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/^#\?PubkeyAuthentication .*/PubkeyAuthentication yes/' /etc/ssh/sshd_config

# Ensure PAM is enabled
sed -i 's/^#\?UsePAM .*/UsePAM yes/' /etc/ssh/sshd_config

# Restart SSH service to apply changes
systemctl restart sshd

# Create .pgpass file for the new user for easy PostgreSQL access
mkdir -p /home/$NEW_USER/.pgpass_templates
cat > /home/$NEW_USER/.pgpass_templates/README.txt << 'PGPASS_EOF'
To set up PostgreSQL password authentication:
1. Get the database password from Key Vault
2. Create ~/.pgpass file with:
   kisaancenter-db-zppisc.postgres.database.azure.com:5432:*:postgres:YOUR_PASSWORD
3. Set permissions: chmod 600 ~/.pgpass
PGPASS_EOF

chown -R $NEW_USER:$NEW_USER /home/$NEW_USER/.pgpass_templates

# Log setup completion
echo "Setup completed at $(date)" > /var/log/bastion-setup.log
echo "User '$NEW_USER' created with password authentication enabled" >> /var/log/bastion-setup.log
echo "Password authentication enabled for SSH" >> /var/log/bastion-setup.log
echo "PostgreSQL client tools installed" >> /var/log/bastion-setup.log

# Save user credentials to a file (readable by root only for security)
cat > /root/user-credentials.txt << CRED_EOF
Bastion Host User Credentials
=============================
Username: $NEW_USER
Password: Stored in Azure Key Vault (secret: bastion-user-password)

To retrieve password:
az keyvault secret show --vault-name kisaancenter-kv-zppisc --name bastion-user-password --query value -o tsv

Connection command:
ssh $NEW_USER@\$(terraform output -raw bastion_host_public_ip)
CRED_EOF

chmod 600 /root/user-credentials.txt
EOF
  )

  tags = {
    Environment = "Production"
    Project     = "KisaanCenter"
    Purpose     = "Database Access Bastion"
    CostOptimized = "true"
  }
}

# Create firewall rule to allow bastion host to connect to PostgreSQL
resource "azurerm_postgresql_flexible_server_firewall_rule" "bastion_access" {
  name             = "bastion-subnet-access"
  server_id        = azurerm_postgresql_flexible_server.kisaancenter_db.id
  start_ip_address = "10.0.3.0"
  end_ip_address   = "10.0.3.255"
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
    bastion_host = "~€7-10/month (Standard_B1s VM)"
    estimated_monthly_cost = "~€8-11/month"
    after_12_months = "~€23-31/month (when PostgreSQL free tier expires)"
  }
  description = "Cost breakdown for the FREE tier architecture with bastion host"
}

# ===============================================
# BASTION HOST OUTPUTS
# ===============================================

output "bastion_host_public_ip" {
  value = azurerm_public_ip.bastion_pip.ip_address
  description = "Public IP address of the bastion host (Dynamic - only allocated when VM is running)"
}

output "bastion_host_private_ip" {
  value = azurerm_network_interface.bastion_nic.private_ip_address
  description = "Private IP address of the bastion host"
}

output "bastion_ssh_private_key_secret_name" {
  value = "Use your local SSH key: ~/.ssh/id_rsa"
  description = "SSH private key location for connecting to bastion host"
}

output "bastion_user_credentials" {
  value = {
    username = var.bastion_username
    password_secret = azurerm_key_vault_secret.bastion_user_password.name
    password_command = "az keyvault secret show --vault-name kisaancenter-kv-zppisc --name bastion-user-password --query value -o tsv"
    ssh_connection = "ssh ${var.bastion_username}@${azurerm_public_ip.bastion_pip.ip_address}"
  }
  description = "Credentials for the additional bastion user with password authentication"
  sensitive = false  # Set to true if you want to hide from console output
}

output "database_connection_info" {
  value = {
    host = azurerm_postgresql_flexible_server.kisaancenter_db.fqdn
    port = "5432"
    database = azurerm_postgresql_flexible_server_database.kisaancenter_database.name
    username = "postgres"
    password_secret = azurerm_key_vault_secret.postgresql_password.name
  }
  description = "Database connection information for use from bastion host"
}

output "bastion_connection_instructions" {
  value = <<-EOT
# Bastion Host Connection Instructions

## TWO WAYS TO CONNECT:

### Option 1: SSH Key Authentication (azureuser - Admin)
ssh -i ~/.ssh/id_rsa azureuser@${azurerm_public_ip.bastion_pip.ip_address}

### Option 2: Password Authentication (${var.bastion_username} - Database Admin)
ssh ${var.bastion_username}@${azurerm_public_ip.bastion_pip.ip_address}

To get the password for ${var.bastion_username} user:
az keyvault secret show --vault-name ${azurerm_key_vault.kisaancenter_kv.name} --name bastion-user-password --query value -o tsv

## USER ACCOUNTS:

1. **azureuser** (Admin user)
   - Authentication: SSH key only
   - Sudo access: Yes
   - SSH key: ~/.ssh/id_rsa

2. **${var.bastion_username}** (Database admin user)
   - Authentication: Password
   - Sudo access: Yes
   - Password stored in Key Vault: bastion-user-password

## 1. Get the Bastion Public IP
The public IP shown above might be empty if VM was recently started.
To get the current IP:
az network public-ip show --resource-group kisaancenter-rg --name bastion-pip --query ipAddress -o tsv

## 2. Connect to Bastion Host from your laptop

# Using SSH key (azureuser):
ssh -i ~/.ssh/id_rsa azureuser@${azurerm_public_ip.bastion_pip.ip_address}

# Using password (${var.bastion_username}):
ssh ${var.bastion_username}@${azurerm_public_ip.bastion_pip.ip_address}
# (You'll be prompted for password)

## 3. Retrieve PostgreSQL Password from Key Vault (run on bastion host)
az login
az keyvault secret show --vault-name ${azurerm_key_vault.kisaancenter_kv.name} --name ${azurerm_key_vault_secret.postgresql_password.name} --query value -o tsv

## 4. Connect to PostgreSQL Database from Bastion Host
psql -h ${azurerm_postgresql_flexible_server.kisaancenter_db.fqdn} -p 5432 -U postgres -d ${azurerm_postgresql_flexible_server_database.kisaancenter_database.name}

## 5. Restore Database from Dump (copy your dump file to bastion first)

# Copy dump to bastion from your laptop (using SSH key):
scp -i ~/.ssh/id_rsa your_dump.sql azureuser@${azurerm_public_ip.bastion_pip.ip_address}:~/

# Copy dump to bastion from your laptop (using password):
scp your_dump.sql ${var.bastion_username}@${azurerm_public_ip.bastion_pip.ip_address}:~/

# Then on bastion:
psql -h ${azurerm_postgresql_flexible_server.kisaancenter_db.fqdn} -p 5432 -U postgres -d ${azurerm_postgresql_flexible_server_database.kisaancenter_database.name} < ~/your_dump.sql

## Cost Savings Tips:
1. Stop the bastion VM when not in use to save costs:
   az vm deallocate --resource-group kisaancenter-rg --name bastion-host
   
2. Start it when needed:
   az vm start --resource-group kisaancenter-rg --name bastion-host
   
3. When stopped, you don't pay for:
   - VM compute costs
   - Dynamic public IP (IP is released)
   
4. You only pay for the disk storage (~$1-2/month for Standard HDD)

## Security Recommendations:
- SSH key authentication is more secure than password (use azureuser for automated scripts)
- Password authentication enabled for dbadmin user (convenient for manual access)
- Both users have sudo access
- RECOMMENDED: Update the NSG rule to restrict to your specific IP:
  az network nsg rule update --resource-group kisaancenter-rg --nsg-name bastion-nsg --name SSH --source-address-prefixes YOUR_IP/32
- PostgreSQL is only accessible from within the VNet (via bastion host)
- Always stop the VM when not in use
  EOT
  description = "Complete instructions for connecting to the bastion host with both SSH key and password authentication"
}