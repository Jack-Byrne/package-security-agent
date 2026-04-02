# TICKET-010: Configuration System

## Context

Implement a flexible configuration system that loads settings from files, environment variables, and defaults, with validation and schema support.

## Prerequisites

- TICKET-001 (project setup)

## Objective

Create configuration system that:

1. Loads from `.security-agent.yml` or `.security-agent.json`
2. Supports environment variable overrides
3. Validates configuration schema
4. Provides sensible defaults
5. Supports per-project customization
6. Handles missing or invalid config gracefully

## Key Components

### `packages/core/src/config.ts`

- `ConfigLoader` class
- Methods: `load()`, `validate()`, `merge()`
- Schema validation using JSON schema or Zod
- Environment variable parsing

### Configuration Schema

```yaml
version: 1
packageAge:
  default: 14
  critical: 30
  dev: 7
vulnerabilitySources: [snyk, osv, github]
fixStrategy:
  mode: hybrid
  llmProvider: anthropic
  maxCost: 10
testing:
  required: true
  commands: [npm test]
  timeout: 300
github:
  autoCreatePR: true
  autoMerge: false
  labels: [security, dependencies]
excludePackages: []
severityThreshold: medium
```

## Acceptance Criteria

### ✅ Validation Steps

1. Build succeeds: `npm run build`
2. Tests pass (10+ tests): `npm test`
3. Loads valid YAML config
4. Loads valid JSON config
5. Validates schema correctly
6. Rejects invalid config
7. Merges with defaults properly
8. Environment variables override file config

### 📋 Checklist

- [ ] ConfigLoader implementation
- [ ] YAML parser support
- [ ] JSON parser support
- [ ] Schema validation
- [ ] Default configuration
- [ ] Environment variable support
- [ ] Config merging logic
- [ ] Error messages for invalid config
- [ ] Tests for all config scenarios

## Success Metrics

- ✅ Loads all valid config formats
- ✅ Catches all invalid configs
- ✅ Clear error messages
- ✅ Environment variables work
- ✅ Test coverage > 80%

## Reference

- `TECHNICAL_SPEC.md` - Config interface
- `ARCHITECTURE.md` - Configuration system design
