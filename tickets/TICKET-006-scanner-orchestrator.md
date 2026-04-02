# TICKET-006: Scanner Engine & Orchestrator

## Context

Implement the core orchestrator that coordinates the entire scanning workflow: detecting package managers, scanning for vulnerabilities, validating package ages, generating fixes, and producing comprehensive scan results.

## Prerequisites

- TICKET-001 through TICKET-005 completed

## Objective

Create the scanner orchestrator that:

1. Detects all package managers in a repository
2. Extracts packages from each manager
3. Scans packages for vulnerabilities across multiple sources
4. Validates package ages against thresholds
5. Generates fixes for identified issues
6. Produces comprehensive ScanResult with statistics
7. Handles errors gracefully and logs progress

## Key Components

### `packages/scanner/src/scanner.ts`

- `Scanner` class - Main scanning engine
- Methods: `scan()`, `scanRepository()`, `aggregateResults()`
- Parallel scanning across vulnerability sources
- Deduplication of vulnerabilities from multiple sources

### `packages/core/src/orchestrator.ts`

- `Orchestrator` class - Main workflow coordinator
- Methods: `run()`, `scanAndFix()`, `generateReport()`
- Coordinates: detection → scanning → age validation → fix generation
- Error handling and retry logic
- Progress logging

### `packages/core/src/config.ts`

- `ConfigLoader` - Loads configuration from file or defaults
- Validates configuration schema
- Merges user config with defaults

## Acceptance Criteria

### ✅ Validation Steps

1. Build succeeds: `npm run build`
2. Tests pass (15+ tests): `npm test`
3. Can scan a real repository end-to-end
4. Produces valid ScanResult with all fields
5. Handles multiple package managers
6. Aggregates vulnerabilities from multiple sources
7. Generates fixes for found vulnerabilities
8. Logs progress clearly

### 📋 Checklist

- [ ] Scanner class with vulnerability aggregation
- [ ] Orchestrator with full workflow
- [ ] ConfigLoader with validation
- [ ] ScanResult type with statistics
- [ ] Error handling and retries
- [ ] Progress logging
- [ ] Parallel vulnerability scanning
- [ ] Deduplication logic
- [ ] Integration tests with real data

## Success Metrics

- ✅ Scans 100-package repo in < 60 seconds
- ✅ Correctly aggregates from multiple sources
- ✅ Deduplicates vulnerabilities by CVE
- ✅ Handles errors without crashing
- ✅ Test coverage > 80%

## Reference

- `TECHNICAL_SPEC.md` - ScanResult interface
- `ARCHITECTURE.md` - Orchestrator design
