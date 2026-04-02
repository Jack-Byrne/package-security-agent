# TICKET-014: Go Package Manager Support

## Context

Implement Go modules package manager support following the same pattern as NPM implementation.

## Prerequisites

- TICKET-001 (project setup)
- TICKET-002 (NPM package manager - use as reference)

## Objective

Create Go package manager that:

1. Detects Go projects (go.mod, go.sum)
2. Extracts packages with versions
3. Updates package versions
4. Regenerates go.sum
5. Queries Go proxy for package metadata

## Key Components

### `packages/package-managers/src/go.ts`

- `GoPackageManager` class extending `PackageManager`
- Parse go.mod and go.sum
- Handle replace directives
- Query Go proxy API (proxy.golang.org)

### Ecosystem Mapping

- Map 'go' ecosystem to Go proxy
- Handle module paths and versions
- Support indirect dependencies

## Acceptance Criteria

### ✅ Validation Steps

1. Build succeeds: `npm run build`
2. Tests pass (8+ tests): `npm test`
3. Detects Go projects correctly
4. Extracts packages from go.mod
5. Updates package versions
6. Queries Go proxy successfully
7. Handles go.sum correctly

### 📋 Checklist

- [ ] GoPackageManager class
- [ ] go.mod parsing
- [ ] go.sum handling
- [ ] Replace directive support
- [ ] Go proxy API integration
- [ ] Version update logic
- [ ] Tests for Go projects
- [ ] Integration with detector

## Success Metrics

- ✅ Detects Go projects
- ✅ Extracts packages correctly
- ✅ Go proxy queries work
- ✅ Test coverage > 80%

## Reference

- TICKET-002 for implementation pattern
- `TECHNICAL_SPEC.md` - PackageManager interface
- Go proxy API: https://go.dev/ref/mod#goproxy-protocol
