# TICKET-016: CLI Tool

## Context

Create a command-line interface tool for running Security Agent locally, useful for development, testing, and manual scans.

## Prerequisites

- TICKET-001 through TICKET-008 completed

## Objective

Create CLI tool that:

1. Provides commands: scan, fix, config
2. Supports flags for configuration
3. Outputs results in multiple formats (JSON, text, markdown)
4. Provides interactive mode for confirmations
5. Handles errors with clear messages
6. Shows progress indicators

## Key Components

### `packages/deployments/cli/src/index.ts`

- CLI entry point using Commander.js
- Commands: scan, fix, config validate
- Flags: --repo, --config, --output, --dry-run
- Progress indicators

### Commands

- `security-agent scan` - Scan repository
- `security-agent fix` - Generate and apply fixes
- `security-agent config validate` - Validate config file
- `security-agent --version` - Show version
- `security-agent --help` - Show help

## Acceptance Criteria

### ✅ Validation Steps

1. Build succeeds: `npm run build`
2. CLI executable created
3. `security-agent --help` works
4. `security-agent scan` runs successfully
5. `security-agent fix --dry-run` shows fixes
6. Output formats work (JSON, text)
7. Error messages are clear

### 📋 Checklist

- [ ] CLI framework setup (Commander.js)
- [ ] scan command
- [ ] fix command
- [ ] config validate command
- [ ] Output formatters (JSON, text, markdown)
- [ ] Progress indicators
- [ ] Error handling
- [ ] Help text
- [ ] Package as executable
- [ ] Tests for CLI commands

## Success Metrics

- ✅ All commands work correctly
- ✅ Clear help text
- ✅ Good error messages
- ✅ Progress indicators helpful
- ✅ Can be installed globally

## Reference

- `ARCHITECTURE.md` - CLI design
- Commander.js: https://github.com/tj/commander.js
