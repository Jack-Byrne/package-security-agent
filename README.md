# Security Agent

AI-powered security vulnerability management for software projects.

## Setup

```bash
npm install
npm run build
npm test
```

## Project Structure

- `packages/core` - Core orchestration logic
- `packages/shared` - Shared utilities and types
- `packages/package-managers` - Package manager implementations
- `packages/vulnerability-sources` - Vulnerability data sources
- `packages/scanner` - Vulnerability scanning engine
- `packages/fix-generator` - Fix generation system
- `packages/test-runner` - Test execution framework
- `packages/github-integration` - GitHub API integration
- `packages/deployments` - Deployment configurations

## Development

```bash
# Build all packages
npm run build

# Run tests
npm test

# Run linting
npm run lint

# Clean build artifacts
npm run clean
```
