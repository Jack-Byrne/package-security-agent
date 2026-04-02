import { promises as fs } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import * as semver from 'semver';
import { Package, PackageManagerError, Logger } from '@security-agent/shared';
import { PackageManager, PackageMetadata } from './base';

const execAsync = promisify(exec);

interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

interface NpmRegistryVersionInfo {
  time?: string;
  deprecated?: boolean;
  dependencies?: Record<string, string>;
}

export class NpmPackageManager extends PackageManager {
  readonly ecosystem = 'npm' as const;
  private logger: Logger;
  private registryUrl: string;

  constructor(registryUrl = 'https://registry.npmjs.org') {
    super();
    this.logger = new Logger({ component: 'NpmPackageManager' });
    this.registryUrl = registryUrl;
  }

  async detect(repoPath: string): Promise<boolean> {
    try {
      const packageJsonPath = join(repoPath, 'package.json');
      await fs.access(packageJsonPath);
      return true;
    } catch {
      return false;
    }
  }

  async extractPackages(repoPath: string): Promise<Package[]> {
    this.logger.info('Extracting NPM packages', { repoPath });

    try {
      const packageJsonPath = join(repoPath, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson: PackageJson = JSON.parse(content);

      const packages: Package[] = [];

      // Extract production dependencies
      if (packageJson.dependencies) {
        for (const [name, versionRange] of Object.entries(
          packageJson.dependencies
        )) {
          const version = await this.resolveVersion(
            repoPath,
            name,
            versionRange
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
          packageJson.devDependencies
        )) {
          const version = await this.resolveVersion(
            repoPath,
            name,
            versionRange
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

      this.logger.info('Extracted packages', {
        count: packages.length,
        production: packages.filter((p) => !p.isDev).length,
        dev: packages.filter((p) => p.isDev).length,
      });

      return packages;
    } catch (error) {
      throw new PackageManagerError(
        `Failed to extract NPM packages: ${(error as Error).message}`,
        { repoPath, error }
      );
    }
  }

  async updatePackage(
    repoPath: string,
    packageName: string,
    newVersion: string
  ): Promise<void> {
    this.logger.info('Updating package', { packageName, newVersion });

    try {
      const packageJsonPath = join(repoPath, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
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
          { packageName, repoPath }
        );
      }

      // Write updated package.json
      await fs.writeFile(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2) + '\n',
        'utf-8'
      );

      this.logger.info('Package updated successfully', {
        packageName,
        newVersion,
      });
    } catch (error) {
      throw new PackageManagerError(
        `Failed to update package: ${(error as Error).message}`,
        { packageName, newVersion, error }
      );
    }
  }

  async regenerateLockFile(repoPath: string): Promise<void> {
    this.logger.info('Regenerating lock file', { repoPath });

    try {
      // Check which lock file exists
      const hasPackageLock = await this.fileExists(
        join(repoPath, 'package-lock.json')
      );
      const hasYarnLock = await this.fileExists(join(repoPath, 'yarn.lock'));
      const hasPnpmLock = await this.fileExists(
        join(repoPath, 'pnpm-lock.yaml')
      );

      if (hasPnpmLock) {
        await execAsync('pnpm install', { cwd: repoPath });
      } else if (hasYarnLock) {
        await execAsync('yarn install', { cwd: repoPath });
      } else if (hasPackageLock) {
        await execAsync('npm install', { cwd: repoPath });
      } else {
        // Default to npm
        await execAsync('npm install', { cwd: repoPath });
      }

      this.logger.info('Lock file regenerated successfully');
    } catch (error) {
      throw new PackageManagerError(
        `Failed to regenerate lock file: ${(error as Error).message}`,
        { repoPath, error }
      );
    }
  }

  async getPackageMetadata(
    packageName: string,
    version?: string
  ): Promise<PackageMetadata> {
    this.logger.debug('Fetching package metadata', { packageName, version });

    try {
      const url = `${this.registryUrl}/${packageName}`;
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          Accept: 'application/json',
        },
      });

      const data = response.data;

      // Parse versions
      const versions: PackageMetadata['versions'] = {};
      for (const [ver, info] of Object.entries(data.versions || {})) {
        const versionInfo = info as NpmRegistryVersionInfo;
        versions[ver] = {
          publishDate: new Date(versionInfo.time || Date.now()),
          deprecated: versionInfo.deprecated,
          dependencies: versionInfo.dependencies,
        };
      }

      // Get download stats (using npm download counts API)
      const downloads = { lastMonth: 0, lastWeek: 0 };
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
        latestVersion: data['dist-tags']?.latest || '',
        homepage: data.homepage,
        repository: data.repository?.url,
        license: data.license,
        maintainers: data.maintainers || [],
        downloads,
      };
    } catch (error) {
      throw new PackageManagerError(
        `Failed to fetch package metadata: ${(error as Error).message}`,
        { packageName, version, error }
      );
    }
  }

  private async resolveVersion(
    repoPath: string,
    packageName: string,
    versionRange: string
  ): Promise<string | null> {
    try {
      // Try to get exact version from lock file first
      const lockVersion = await this.getVersionFromLockFile(
        repoPath,
        packageName
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
      this.logger.warn('Failed to resolve version', {
        packageName,
        versionRange,
        error: (error as Error).message,
      });
      return null;
    }
  }

  private async getVersionFromLockFile(
    repoPath: string,
    packageName: string
  ): Promise<string | null> {
    try {
      // Try package-lock.json
      const packageLockPath = join(repoPath, 'package-lock.json');
      if (await this.fileExists(packageLockPath)) {
        const content = await fs.readFile(packageLockPath, 'utf-8');
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
      const yarnLockPath = join(repoPath, 'yarn.lock');
      if (await this.fileExists(yarnLockPath)) {
        const content = await fs.readFile(yarnLockPath, 'utf-8');
        const match = content.match(
          new RegExp(`${packageName}@.*?:\\s+version\\s+"([^"]+)"`)
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

// Made with Bob
