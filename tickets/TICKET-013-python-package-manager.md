# TICKET-013: Python Package Manager Support

## Context

Implement Python package manager support (pip, poetry, pipenv) following the same pattern as NPM implementation.

## Prerequisites

- TICKET-001 (project setup)
- TICKET-002 (NPM package manager - use as reference)

## Objective

Create Python package manager that:

1. Detects Python projects (requirements.txt, Pipfile, pyproject.toml)
2. Extracts packages with versions
3. Updates package versions
4. Regenerates lock files
5. Queries PyPI for package metadata

## Key Components

### `packages/package-managers/src/pip.ts`

- `PipPackageManager` class extending `PackageManager`
- Parse requirements.txt, Pipfile, pyproject.toml
- Handle poetry.lock, Pipfile.lock
- Query PyPI JSON API

### Ecosystem Mapping

- Map 'pip' ecosystem to PyPI registry
- Handle Python version constraints
- Support extras and markers

## Acceptance Criteria

### ✅ Validation Steps

1. Build succeeds: `npm run build`
2. Tests pass (8+ tests): `npm test`
3. Detects Python projects correctly
4. Extracts packages from all formats
5. Updates package versions
6. Queries PyPI successfully
7. Handles lock files

### 📋 Checklist

- [ ] PipPackageManager class
- [ ] requirements.txt parsing
- [ ] Pipfile parsing
- [ ] pyproject.toml parsing (poetry)
- [ ] Lock file handling
- [ ] PyPI API integration
- [ ] Version update logic
- [ ] Tests for all formats
- [ ] Integration with detector

## Success Metrics

- ✅ Detects all Python project types
- ✅ Extracts packages correctly
- ✅ PyPI queries work
- ✅ Test coverage > 80%

## Reference

- TICKET-002 for implementation pattern
- `TECHNICAL_SPEC.md` - PackageManager interface
- PyPI JSON API: https://warehouse.pypa.io/api-reference/json.html
