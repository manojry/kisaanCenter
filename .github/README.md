# 🚀 KisaanCenter GitHub Actions Workflows

This repository includes comprehensive GitHub Actions workflows for CI/CD, testing, releases, and monitoring. All workflows are designed for public GitHub repositories and include advanced options for workflow optimization.

## 📋 Available Workflows

### 1. 🔄 **Main CI/CD Pipeline** (`.github/workflows/ci-cd.yml`)

**Triggers:**
- 🔀 Push to `main` branch (required stages only)
- 🔀 Pull requests to `main`
- 🎯 Manual dispatch with advanced options

**Features:**
- ✅ Code quality & linting (Black, isort, flake8, mypy)
- 🧪 Comprehensive test suite with coverage
- 🔒 Security vulnerability scanning
- 🐳 Docker image building and publishing
- 🚀 Automated releases with changelog generation
- 🌍 Multi-environment deployment support

**Manual Dispatch Options:**
```yaml
Skip Stages:
  - skip_lint: Skip code linting and formatting checks
  - skip_tests: Skip test execution (not recommended)
  - skip_security: Skip security vulnerability scans
  - skip_build: Skip Docker image build

Release Options:
  - create_release: Create a new release
  - release_tag: Custom tag (e.g., v1.0.0, v0.0.1)
  - release_type: patch/minor/major
  - environment: development/staging/production
```

### 2. 🐳 **Docker Build & Push** (`.github/workflows/docker.yml`)

**Purpose:** Build and publish Docker images on-demand

**Features:**
- 🏗️ Multi-stage optimized builds
- 🌍 Multi-platform support (AMD64, ARM64)
- 📦 GitHub Container Registry publishing
- 🔒 Security-hardened images

**Usage:**
```bash
# Manual trigger with custom tag
Inputs:
  - tag: Docker image tag (default: latest)
  - push_to_registry: Push to GitHub Container Registry (default: true)
```

### 3. 🧪 **Test Suite** (`.github/workflows/test.yml`)

**Purpose:** Comprehensive testing with matrix support

**Features:**
- 🔄 Matrix testing (Python 3.10, 3.11, 3.12)
- 🧪 Unit, Integration, API, and Performance tests
- 📊 Coverage reporting with Codecov integration
- 🗄️ PostgreSQL and Redis test services
- ⏰ Scheduled daily runs at 2 AM UTC

**Test Types:**
- **Unit Tests:** Core business logic validation
- **Integration Tests:** Database and service integration
- **API Tests:** Endpoint functionality testing
- **Performance Tests:** Benchmark and load testing

### 4. 🚀 **Release Manager** (`.github/workflows/release.yml`)

**Purpose:** Automated release creation with version management

**Features:**
- 📈 Semantic versioning (patch/minor/major)
- 📝 Automatic changelog generation
- 🐳 Release-specific Docker images
- 🏷️ Git tagging and GitHub releases
- 📋 Custom release notes support

**Version Examples:**
```
Current: v0.0.5
├── patch → v0.0.6
├── minor → v0.1.0
├── major → v1.0.0
└── prerelease → v0.0.6-rc.1
```

### 5. 🏥 **Health Check** (`.github/workflows/health.yml`)

**Purpose:** Monitor service health and dependencies

**Features:**
- 🔄 Scheduled health checks every 6 hours
- 🔍 Endpoint availability monitoring
- 🔒 Dependency security scanning
- 📊 Health status reporting

## 🎯 Quick Start Guide

### Running Your First Workflow

1. **Trigger Main CI/CD Pipeline:**
   ```
   Go to Actions → KisaanCenter CI/CD Pipeline → Run workflow
   ```

2. **Create Your First Release:**
   ```
   Go to Actions → Release Manager → Run workflow
   Input: release_type = patch (for v0.0.1)
   ```

3. **Run Tests Only:**
   ```
   Go to Actions → Test Suite → Run workflow
   Select: test_type = unit, python_version = 3.11
   ```

### Release Versioning Strategy

Starting from `v0.0.1`, follow semantic versioning:

```
v0.0.1 → v0.0.2 → v0.0.3 ... → v0.1.0 → v0.1.1 ... → v1.0.0
```

**When to use each type:**
- **Patch** (v0.0.1 → v0.0.2): Bug fixes, small improvements
- **Minor** (v0.0.x → v0.1.0): New features, API additions
- **Major** (v0.x.x → v1.0.0): Breaking changes, major releases

## 🔧 Workflow Configuration

### Environment Variables

The workflows use these environment variables:

```yaml
PYTHON_VERSION: '3.11'        # Default Python version
NODE_VERSION: '18'           # Node.js version (if needed)
REGISTRY: ghcr.io           # Container registry
IMAGE_NAME: ${{ github.repository }}  # Docker image name
```

### Required Secrets

All workflows use the default `GITHUB_TOKEN` - no additional secrets needed for basic functionality.

### Optional Enhancements

For advanced features, consider adding:

```yaml
# For external services
CODECOV_TOKEN: xxx          # Enhanced coverage reporting
SLACK_WEBHOOK: xxx          # Deployment notifications
DOCKER_HUB_TOKEN: xxx       # Additional registry publishing
```

## 📊 Workflow Outputs

### Artifacts Generated

Each workflow produces relevant artifacts:

- **CI/CD:** Test results, coverage reports, security scans
- **Test Suite:** HTML reports, coverage data, benchmark results
- **Docker:** Multi-platform container images
- **Release:** GitHub releases with changelogs
- **Health:** Security and health reports

### GitHub Releases

Releases include:
- 📝 Auto-generated changelogs
- 🐳 Docker image references
- 📊 API documentation links
- 🔗 Full changelog comparisons

## 🚀 Production Deployment

### Docker Usage

```bash
# Pull the latest release
docker pull ghcr.io/yourusername/kisaancenter:v1.0.0

# Run the application
docker run -p 8000:8000 ghcr.io/yourusername/kisaancenter:v1.0.0

# Health check
curl http://localhost:8000/health
```

### Environment-Specific Deployments

The workflows support multiple environments:

- **Development:** Automatic deploys from `main`
- **Staging:** Manual workflow dispatch
- **Production:** Release-triggered deployments

## 🔍 Monitoring and Debugging

### Workflow Status

Monitor workflow status through:
- GitHub Actions tab
- Workflow summary pages
- Artifact downloads
- Release notifications

### Common Issues

1. **Test Failures:** Check test artifacts for detailed reports
2. **Build Failures:** Review Docker build logs
3. **Security Issues:** Download security scan reports
4. **Version Conflicts:** Verify release tag formatting

## 🎉 Best Practices

### For Development

1. **Use Draft Releases** for testing
2. **Run tests locally** before pushing
3. **Follow conventional commits** for better changelogs
4. **Use workflow dispatch** for testing new features

### For Production

1. **Always use tagged releases**
2. **Monitor health check results**
3. **Review security scan reports**
4. **Backup before major version updates**

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Semantic Versioning](https://semver.org/)
- [KisaanCenter API Documentation](./API_DOCUMENTATION.md)

---

🎯 **Ready to deploy?** Start with running the main CI/CD pipeline to validate your setup!
