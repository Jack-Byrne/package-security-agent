# TICKET-015: Maven Package Manager Support

## Context

Implement Maven package manager support for Java projects following the same pattern as NPM implementation.

## Prerequisites

- TICKET-001 (project setup)
- TICKET-002 (NPM package manager - use as reference)

## Objective

Create Maven package manager that:

1. Detects Maven projects (pom.xml)
2. Extracts dependencies with versions
3. Updates dependency versions
4. Queries Maven Central for package metadata
5. Handles dependency scopes (compile, test, provided)

## Key Components

### `packages/package-managers/src/maven.ts`

- `MavenPackageManager` class extending `PackageManager`
- Parse pom.xml (XML parsing)
- Handle dependency scopes
- Query Maven Central API

### Ecosystem Mapping

- Map 'maven' ecosystem to Maven Central
- Handle groupId:artifactId:version format
- Support dependency scopes

## Acceptance Criteria

### ✅ Validation Steps

1. Build succeeds: `npm run build`
2. Tests pass (8+ tests): `npm test`
3. Detects Maven projects correctly
4. Extracts dependencies from pom.xml
5. Updates dependency versions
6. Queries Maven Central successfully
7. Handles dependency scopes

### 📋 Checklist

- [ ] MavenPackageManager class
- [ ] pom.xml parsing (XML)
- [ ] Dependency scope handling
- [ ] Maven Central API integration
- [ ] Version update logic
- [ ] Tests for Maven projects
- [ ] Integration with detector

## Success Metrics

- ✅ Detects Maven projects
- ✅ Extracts dependencies correctly
- ✅ Maven Central queries work
- ✅ Test coverage > 80%

## Reference

- TICKET-002 for implementation pattern
- `TECHNICAL_SPEC.md` - PackageManager interface
- Maven Central: https://search.maven.org/
