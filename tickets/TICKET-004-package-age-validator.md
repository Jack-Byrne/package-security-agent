# TICKET-004: Package Age Validator

## Context

Implement a system to validate that packages meet minimum age requirements before being considered safe. This prevents installation of newly published packages that may be compromised in supply chain attacks.

## Prerequisites

- TICKET-001 (project setup)
- TICKET-002 (NPM package manager)

## Objective

Create a package age validator that:

1. Queries package registries for publish dates
2. Compares against configurable age thresholds
3. Supports different thresholds for production vs dev dependencies
4. Caches results to reduce API calls
5. Returns violations with recommendations

## Key Components

### `packages/scanner/src/age-validator.ts`

- `AgeValidator` class
- Methods: `validatePackage()`, `validateBatch()`, `getThreshold()`
- Configurable thresholds: default (14 days), critical (30 days), dev (7 days)
- Cache with TTL

### `packages/scanner/src/types.ts`

```typescript
interface AgeViolation {
  package: Package;
  currentAge: number; // days since publish
  requiredAge: number; // threshold
  publishDate: Date;
  recommendation: string;
}
```

## Acceptance Criteria

### ✅ Validation Steps

1. Build succeeds: `npm run build`
2. Tests pass (8+ tests): `npm test`
3. Can validate package age: Test with known package
4. Respects different thresholds for prod/dev
5. Caching reduces API calls on repeated checks
6. Returns proper AgeViolation objects

### 📋 Checklist

- [ ] AgeValidator class implemented
- [ ] Configurable thresholds (default, critical, dev)
- [ ] Caching with TTL
- [ ] Batch validation support
- [ ] Integration with PackageManager.getPackageMetadata()
- [ ] Tests covering all threshold scenarios
- [ ] Error handling for API failures

## Success Metrics

- ✅ Validates 100 packages in < 10 seconds (with cache)
- ✅ Correctly identifies packages < threshold
- ✅ Cache hit rate > 80% on repeated scans
- ✅ Test coverage > 80%

## Reference

- `TECHNICAL_SPEC.md` - AgeViolation interface
- `ARCHITECTURE.md` - Age validation component design
