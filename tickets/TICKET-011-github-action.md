# TICKET-011: GitHub Action Deployment

## Context

Create a GitHub Action that allows users to run Security Agent as part of their CI/CD workflow with scheduled scans and manual triggers.

## Prerequisites

- TICKET-001 through TICKET-008 completed

## Objective

Create GitHub Action that:

1. Runs on schedule (cron) or manual trigger
2. Checks out repository
3. Runs security scan
4. Creates PRs for fixes
5. Posts results as workflow summary
6. Handles secrets securely
7. Supports configuration via action inputs

## Key Components

### `packages/deployments/github-action/action.yml`

- Action metadata and inputs
- Runs using Node.js 20
- Input parameters: github-token, config-path, etc.

### `packages/deployments/github-action/src/index.ts`

- Action entry point
- Loads inputs from GitHub context
- Runs orchestrator
- Posts results to workflow summary
- Handles errors and sets action status

### `.github/workflows/example.yml`

- Example workflow file
- Shows scheduled and manual triggers
- Demonstrates configuration

## Acceptance Criteria

### ✅ Validation Steps

1. Build succeeds: `npm run build`
2. Action bundle created: `dist/index.js`
3. Can run locally with `act` tool
4. Runs in real GitHub workflow
5. Creates PRs successfully
6. Posts workflow summary
7. Handles errors gracefully

### 📋 Checklist

- [ ] action.yml with metadata
- [ ] Action entry point
- [ ] Input parameter handling
- [ ] GitHub context integration
- [ ] Workflow summary posting
- [ ] Error handling
- [ ] Action bundling (ncc or similar)
- [ ] Example workflow file
- [ ] README for action usage
- [ ] Tests for action logic

## Success Metrics

- ✅ Runs successfully in GitHub Actions
- ✅ Creates valid PRs
- ✅ Clear workflow summaries
- ✅ Handles secrets securely
- ✅ Example workflow works

## Reference

- `ARCHITECTURE.md` - GitHub Action design
- GitHub Actions docs: https://docs.github.com/en/actions
