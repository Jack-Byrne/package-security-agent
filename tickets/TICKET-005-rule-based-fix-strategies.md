# TICKET-005: Rule-Based Fix Strategies

## Context

Implement deterministic, rule-based strategies for automatically fixing common vulnerability patterns. These strategies handle straightforward cases like version bumps and dependency replacements without requiring LLM calls.

## Prerequisites

- TICKET-001 (project setup)
- TICKET-002 (NPM package manager)
- TICKET-003 (OSV.dev vulnerability source)

## Objective

Create rule-based fix strategies that:

1. Detect if they can handle a vulnerability
2. Generate fixes (version bumps, dependency replacements)
3. Assess risk levels and breaking changes
4. Generate file changes for package.json and lock files
5. Provide cost estimates (time/complexity)

## Key Components

### `packages/fix-generator/src/base.ts`

- `FixStrategy` interface with methods: `canHandle()`, `generateFix()`, `assessRisk()`, `estimateCost()`
- `Fix` interface with file changes, risk level, breaking changes flag

### `packages/fix-generator/src/rule-based/version-bump.ts`

- `VersionBumpStrategy` - Updates package to fixed version
- Handles semver ranges and version resolution
- Detects breaking changes (major version bumps)

### `packages/fix-generator/src/rule-based/dependency-replace.ts`

- `DependencyReplaceStrategy` - Replaces vulnerable package with safe alternative
- Maintains known safe alternatives mapping
- Higher risk due to API changes

### `packages/fix-generator/src/strategy-selector.ts`

- `StrategySelector` - Chooses appropriate strategy for vulnerability
- Priority ordering: version bump > dependency replace

## Acceptance Criteria

### ✅ Validation Steps

1. Build succeeds: `npm run build`
2. Tests pass (12+ tests): `npm test`
3. VersionBumpStrategy generates valid fixes
4. DependencyReplaceStrategy suggests alternatives
5. Risk assessment works correctly
6. Breaking change detection accurate

### 📋 Checklist

- [ ] FixStrategy base interface
- [ ] VersionBumpStrategy implemented
- [ ] DependencyReplaceStrategy implemented
- [ ] StrategySelector with priority logic
- [ ] Risk assessment (low/medium/high)
- [ ] Breaking change detection
- [ ] File change generation
- [ ] Tests for each strategy

## Success Metrics

- ✅ Handles 90%+ of simple version bump cases
- ✅ Correctly identifies breaking changes
- ✅ Risk assessment matches actual risk
- ✅ Test coverage > 80%

## Reference

- `TECHNICAL_SPEC.md` - FixStrategy interface
- `ARCHITECTURE.md` - Fix generation design
