# TICKET-002: NPM Package Manager Implementation

## Context

You are implementing the NPM package manager support for the Security Agent. This component will detect NPM projects, extract package information, and provide package update capabilities. This is part of a larger system that scans for vulnerabilities across multiple package ecosystems.

## Prerequisites

- TICKET-001 must be completed (project setup)
- Familiarity with npm, package.json, and lock files

## Objective

Implement a complete NPM package manager handler that can:

1. Detect NPM projects
2. Extract all packages with versions
3. Update package versions
4. Regenerate lock files
5. Query npm registry for package metadata

## Tasks

### 1. Install Dependencies

```bash
cd packages/package-managers
npm install semver axios @types/semver
```

### 2. Create Package Structure

#### `packages/package-managers/package.json`

```json
{
  "name": "@security-agent/package-managers",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src --ext .ts",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@security-agent/shared": "workspace:*",
    "semver": "^7.5.4",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0",
    "@types/semver": "^7.5.0"
  }
}
```

#### `packages/package-managers/tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### 3. Create Base Interface

#### `packages/package-managers/src/base.ts`

```typescript
import { Package, Ecosystem } from "@security-agent/shared";

export interface PackageMetadata {
  name: string;
  versions: {
    [version: string]: {
      publishDate: Date;
      deprecated?: boolean;
      dependencies?: Record<string, string>;
    };
  };
  latestVersion: string;
  homepage?: string;
  repository?: string;
  license?: string;
  maintainers: Array<{
    name: string;
    email?: string;
  }>;
  downloads: {
    lastMonth: number;
    lastWeek: number;
  };
}

export abstract class PackageManager {
  abstract readonly ecosystem: Ecosystem;

  /**
   * Detect if this package manager is used in the repository
   */
  abstract detect(repoPath: string): Promise<boolean>;

  /**
   * Extract all packages from the repository
   */
  abstract extractPackages(repoPath: string): Promise<Package[]>;

  /**
   * Update a package to a new version
   */
  abstract updatePackage(
    repoPath: string,
    packageName: string,
    newVersion: string,
  ): Promise<void>;

  /**
   * Regenerate lock file after package updates
   */
  abstract regenerateLockFile(repoPath: string): Promise<void>;

  /**
   * Get package metadata from registry
   */
  abstract getPackageMetadata(
    packageName: string,
    version?: string,
  ): Promise<PackageMetadata>;
}
```

### 4. Implement NPM Package Manager

#### `packages/package-managers/src/npm.ts`

```typescript
import { promises as fs } from "fs";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";
import axios from "axios";
import * as semver from "semver";
import { Package, PackageManagerError, Logger } from "@security-agent/shared";
import { PackageManager, PackageMetadata } from "./base";

const execAsync = promisify(exec);

interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

export class NpmPackageManager extends PackageManager {
  readonly ecosystem = "npm" as const;
  private logger: Logger;
  private registryUrl: string;

  constructor(registryUrl = "https://registry.npmjs.org") {
    super();
    this.logger = new Logger({ component: "NpmPackageManager" });
    this.registryUrl = registryUrl;
  }

  async detect(repoPath: string): Promise<boolean> {
    try {
      const packageJsonPath = join(repoPath, "package.json");
      await fs.access(packageJsonPath);
      return true;
    } catch {
      return false;
    }
  }

  async extractPackages(repoPath: string): Promise<Package[]> {
    this.logger.info("Extracting NPM packages", { repoPath });

    try {
      const packageJsonPath = join(repoPath, "package.json");
      const content = await fs.readFile(packageJsonPath, "utf-8");
      const packageJson: PackageJson = JSON.parse(content);

      const packages: Package[] = [];

      // Extract production dependencies
      if (packageJson.dependencies) {
        for (const [name, versionRange] of Object.entries(
          packageJson.dependencies,
        )) {
          const version = await this.resolveVersion(
            repoPath,
            name,
            versionRange,
          );
          if (version) {
            packages.push({
              name,
              version,
              ecosystem: this.ecosystem,
              isDev: false,
            });
          }
        }
      }

      // Extract dev dependencies
      if (packageJson.devDependencies) {
        for (const [name, versionRange] of Object.entries(
          packageJson.devDependencies,
        )) {
          const version = await this.resolveVersion(
            repoPath,
            name,
            versionRange,
          );
          if (version) {
            packages.push({
              name,
              version,
              ecosystem: this.ecosystem,
              isDev: true,
            });
          }
        }
      }

      this.logger.info("Extracted packages", {
        count: packages.length,
        production: packages.filter((p) => !p.isDev).length,
        dev: packages.filter((p) => p.isDev).length,
      });

      return packages;
    } catch (error) {
      throw new PackageManagerError(
        `Failed to extract NPM packages: ${error.message}`,
        { repoPath, error },
      );
    }
  }

  async updatePackage(
    repoPath: string,
    packageName: string,
    newVersion: string,
  ): Promise<void> {
    this.logger.info("Updating package", { packageName, newVersion });

    try {
      const packageJsonPath = join(repoPath, "package.json");
      const content = await fs.readFile(packageJsonPath, "utf-8");
      const packageJson: PackageJson = JSON.parse(content);

      let updated = false;

      // Update in dependencies
      if (packageJson.dependencies?.[packageName]) {
        packageJson.dependencies[packageName] = newVersion;
        updated = true;
      }

      // Update in devDependencies
      if (packageJson.devDependencies?.[packageName]) {
        packageJson.devDependencies[packageName] = newVersion;
        updated = true;
      }

      if (!updated) {
        throw new PackageManagerError(
          `Package ${packageName} not found in package.json`,
          { packageName, repoPath },
        );
      }

      // Write updated package.json
      await fs.writeFile(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2) + "\n",
        "utf-8",
      );

      this.logger.info("Package updated successfully", {
        packageName,
        newVersion,
      });
    } catch (error) {
      throw new PackageManagerError(
        `Failed to update package: ${error.message}`,
        { packageName, newVersion, error },
      );
    }
  }

  async regenerateLockFile(repoPath: string): Promise<void> {
    this.logger.info("Regenerating lock file", { repoPath });

    try {
      // Check which lock file exists
      const hasPackageLock = await this.fileExists(
        join(repoPath, "package-lock.json"),
      );
      const hasYarnLock = await this.fileExists(join(repoPath, "yarn.lock"));
      const hasPnpmLock = await this.fileExists(
        join(repoPath, "pnpm-lock.yaml"),
      );

      if (hasPnpmLock) {
        await execAsync("pnpm install", { cwd: repoPath });
      } else if (hasYarnLock) {
        await execAsync("yarn install", { cwd: repoPath });
      } else if (hasPackageLock) {
        await execAsync("npm install", { cwd: repoPath });
      } else {
        // Default to npm
        await execAsync("npm install", { cwd: repoPath });
      }

      this.logger.info("Lock file regenerated successfully");
    } catch (error) {
      throw new PackageManagerError(
        `Failed to regenerate lock file: ${error.message}`,
        { repoPath, error },
      );
    }
  }

  async getPackageMetadata(
    packageName: string,
    version?: string,
  ): Promise<PackageMetadata> {
    this.logger.debug("Fetching package metadata", { packageName, version });

    try {
      const url = `${this.registryUrl}/${packageName}`;
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          Accept: "application/json",
        },
      });

      const data = response.data;

      // Parse versions
      const versions: PackageMetadata["versions"] = {};
      for (const [ver, info] of Object.entries(data.versions || {})) {
        versions[ver] = {
          publishDate: new Date((info as any).time || Date.now()),
          deprecated: (info as any).deprecated,
          dependencies: (info as any).dependencies,
        };
      }

      // Get download stats (using npm download counts API)
      let downloads = { lastMonth: 0, lastWeek: 0 };
      try {
        const downloadsUrl = `https://api.npmjs.org/downloads/point/last-month/${packageName}`;
        const dlResponse = await axios.get(downloadsUrl, { timeout: 5000 });
        downloads.lastMonth = dlResponse.data.downloads || 0;

        const weekUrl = `https://api.npmjs.org/downloads/point/last-week/${packageName}`;
        const weekResponse = await axios.get(weekUrl, { timeout: 5000 });
        downloads.lastWeek = weekResponse.data.downloads || 0;
      } catch {
        // Download stats are optional
      }

      return {
        name: data.name,
        versions,
        latestVersion: data["dist-tags"]?.latest || "",
        homepage: data.homepage,
        repository: data.repository?.url,
        license: data.license,
        maintainers: data.maintainers || [],
        downloads,
      };
    } catch (error) {
      throw new PackageManagerError(
        `Failed to fetch package metadata: ${error.message}`,
        { packageName, version, error },
      );
    }
  }

  private async resolveVersion(
    repoPath: string,
    packageName: string,
    versionRange: string,
  ): Promise<string | null> {
    try {
      // Try to get exact version from lock file first
      const lockVersion = await this.getVersionFromLockFile(
        repoPath,
        packageName,
      );
      if (lockVersion) {
        return lockVersion;
      }

      // If no lock file, resolve from version range
      if (semver.valid(versionRange)) {
        return versionRange;
      }

      // For ranges like "^1.0.0", get the latest matching version
      const metadata = await this.getPackageMetadata(packageName);
      const versions = Object.keys(metadata.versions);
      const maxSatisfying = semver.maxSatisfying(versions, versionRange);

      return maxSatisfying;
    } catch (error) {
      this.logger.warn("Failed to resolve version", {
        packageName,
        versionRange,
        error: error.message,
      });
      return null;
    }
  }

  private async getVersionFromLockFile(
    repoPath: string,
    packageName: string,
  ): Promise<string | null> {
    try {
      // Try package-lock.json
      const packageLockPath = join(repoPath, "package-lock.json");
      if (await this.fileExists(packageLockPath)) {
        const content = await fs.readFile(packageLockPath, "utf-8");
        const lockData = JSON.parse(content);

        // npm v7+ format
        if (lockData.packages) {
          const pkg = lockData.packages[`node_modules/${packageName}`];
          if (pkg?.version) {
            return pkg.version;
          }
        }

        // npm v6 format
        if (lockData.dependencies?.[packageName]?.version) {
          return lockData.dependencies[packageName].version;
        }
      }

      // Try yarn.lock (basic parsing)
      const yarnLockPath = join(repoPath, "yarn.lock");
      if (await this.fileExists(yarnLockPath)) {
        const content = await fs.readFile(yarnLockPath, "utf-8");
        const match = content.match(
          new RegExp(`${packageName}@.*?:\\s+version\\s+"([^"]+)"`),
        );
        if (match) {
          return match[1];
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }
}
```

### 5. Create Package Manager Detector

#### `packages/package-managers/src/detector.ts`

```typescript
import { Logger } from "@security-agent/shared";
import { PackageManager } from "./base";
import { NpmPackageManager } from "./npm";

export class PackageManagerDetector {
  private logger: Logger;
  private managers: PackageManager[];

  constructor() {
    this.logger = new Logger({ component: "PackageManagerDetector" });
    this.managers = [new NpmPackageManager()];
  }

  async detectAll(repoPath: string): Promise<PackageManager[]> {
    this.logger.info("Detecting package managers", { repoPath });

    const detected: PackageManager[] = [];

    for (const manager of this.managers) {
      if (await manager.detect(repoPath)) {
        this.logger.info("Detected package manager", {
          ecosystem: manager.ecosystem,
        });
        detected.push(manager);
      }
    }

    if (detected.length === 0) {
      this.logger.warn("No package managers detected", { repoPath });
    }

    return detected;
  }

  async detectFirst(repoPath: string): Promise<PackageManager | null> {
    const detected = await this.detectAll(repoPath);
    return detected[0] || null;
  }
}
```

### 6. Create Index Export

#### `packages/package-managers/src/index.ts`

```typescript
export * from "./base";
export * from "./npm";
export * from "./detector";
```

### 7. Create Tests

#### `packages/package-managers/src/__tests__/npm.test.ts`

```typescript
import { NpmPackageManager } from "../npm";
import { promises as fs } from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("NpmPackageManager", () => {
  let manager: NpmPackageManager;
  let testDir: string;

  beforeEach(async () => {
    manager = new NpmPackageManager();
    testDir = join(tmpdir(), `test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe("detect", () => {
    it("should detect npm project with package.json", async () => {
      await fs.writeFile(
        join(testDir, "package.json"),
        JSON.stringify({ name: "test" }),
      );

      const result = await manager.detect(testDir);
      expect(result).toBe(true);
    });

    it("should not detect project without package.json", async () => {
      const result = await manager.detect(testDir);
      expect(result).toBe(false);
    });
  });

  describe("extractPackages", () => {
    it("should extract production dependencies", async () => {
      const packageJson = {
        name: "test-project",
        dependencies: {
          express: "4.18.0",
          lodash: "4.17.21",
        },
      };

      await fs.writeFile(
        join(testDir, "package.json"),
        JSON.stringify(packageJson),
      );

      const packages = await manager.extractPackages(testDir);

      expect(packages.length).toBeGreaterThanOrEqual(2);
      expect(packages.some((p) => p.name === "express")).toBe(true);
      expect(packages.some((p) => p.name === "lodash")).toBe(true);
      expect(packages.every((p) => p.ecosystem === "npm")).toBe(true);
    });

    it("should mark dev dependencies correctly", async () => {
      const packageJson = {
        name: "test-project",
        dependencies: {
          express: "4.18.0",
        },
        devDependencies: {
          jest: "29.0.0",
        },
      };

      await fs.writeFile(
        join(testDir, "package.json"),
        JSON.stringify(packageJson),
      );

      const packages = await manager.extractPackages(testDir);

      const express = packages.find((p) => p.name === "express");
      const jest = packages.find((p) => p.name === "jest");

      expect(express?.isDev).toBe(false);
      expect(jest?.isDev).toBe(true);
    });
  });

  describe("updatePackage", () => {
    it("should update package version in package.json", async () => {
      const packageJson = {
        name: "test-project",
        dependencies: {
          express: "4.18.0",
        },
      };

      await fs.writeFile(
        join(testDir, "package.json"),
        JSON.stringify(packageJson, null, 2),
      );

      await manager.updatePackage(testDir, "express", "4.18.2");

      const updated = JSON.parse(
        await fs.readFile(join(testDir, "package.json"), "utf-8"),
      );

      expect(updated.dependencies.express).toBe("4.18.2");
    });

    it("should throw error for non-existent package", async () => {
      const packageJson = {
        name: "test-project",
        dependencies: {},
      };

      await fs.writeFile(
        join(testDir, "package.json"),
        JSON.stringify(packageJson),
      );

      await expect(
        manager.updatePackage(testDir, "nonexistent", "1.0.0"),
      ).rejects.toThrow();
    });
  });

  describe("getPackageMetadata", () => {
    it("should fetch package metadata from npm registry", async () => {
      const metadata = await manager.getPackageMetadata("express");

      expect(metadata.name).toBe("express");
      expect(metadata.latestVersion).toBeTruthy();
      expect(Object.keys(metadata.versions).length).toBeGreaterThan(0);
    });

    it("should handle non-existent packages", async () => {
      await expect(
        manager.getPackageMetadata(
          "this-package-definitely-does-not-exist-12345",
        ),
      ).rejects.toThrow();
    });
  });
});
```

## Acceptance Criteria

### ✅ Validation Steps

1. **Build succeeds**

   ```bash
   cd packages/package-managers
   npm install
   npm run build
   ```

   Expected: Exit code 0, `dist/` directory created with all files

2. **Tests pass**

   ```bash
   npm test
   ```

   Expected: All tests pass (at least 8 tests)

3. **Linting passes**

   ```bash
   npm run lint
   ```

   Expected: No linting errors

4. **Can detect NPM projects**

   ```bash
   node -e "
   const { NpmPackageManager } = require('./dist/npm');
   const manager = new NpmPackageManager();
   manager.detect('.').then(result => console.log('Detected:', result));
   "
   ```

   Expected: Output `Detected: true` (if run in npm project)

5. **Can extract packages**
   Create test package.json:

   ```bash
   mkdir test-project
   cd test-project
   echo '{"dependencies":{"express":"4.18.0"}}' > package.json
   ```

   Then test:

   ```bash
   node -e "
   const { NpmPackageManager } = require('../packages/package-managers/dist/npm');
   const manager = new NpmPackageManager();
   manager.extractPackages('./test-project').then(pkgs => {
     console.log('Packages:', pkgs.length);
     console.log('Express found:', pkgs.some(p => p.name === 'express'));
   });
   "
   ```

   Expected: Shows package count and `Express found: true`

6. **Can fetch package metadata**
   ```bash
   node -e "
   const { NpmPackageManager } = require('./packages/package-managers/dist/npm');
   const manager = new NpmPackageManager();
   manager.getPackageMetadata('express').then(meta => {
     console.log('Package:', meta.name);
     console.log('Latest:', meta.latestVersion);
     console.log('Versions:', Object.keys(meta.versions).length);
   });
   "
   ```
   Expected: Shows express metadata with version information

### 📋 Checklist

- [ ] Package dependencies installed
- [ ] Base interface created with all required methods
- [ ] NpmPackageManager class implemented
- [ ] PackageManagerDetector created
- [ ] All exports in index.ts
- [ ] Tests written and passing
- [ ] Build completes successfully
- [ ] Linting passes
- [ ] Can detect NPM projects
- [ ] Can extract packages from package.json
- [ ] Can update package versions
- [ ] Can fetch package metadata from npm registry
- [ ] Handles both dependencies and devDependencies
- [ ] Handles lock files (package-lock.json, yarn.lock)

## Success Metrics

- ✅ All 8+ tests pass
- ✅ Can detect NPM projects correctly
- ✅ Extracts all dependencies with correct metadata
- ✅ Updates package.json correctly
- ✅ Fetches real package metadata from npm registry
- ✅ Handles errors gracefully
- ✅ No TypeScript compilation errors
- ✅ No linting errors

## Next Steps

After completing this ticket, proceed to:

- **TICKET-003**: Implement OSV.dev Vulnerability Source Integration

## Reference Documents

- `TECHNICAL_SPEC.md` - PackageManager interface specification
- `ARCHITECTURE.md` - Package manager component design
