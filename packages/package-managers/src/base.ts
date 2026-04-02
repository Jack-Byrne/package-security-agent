import { Package, Ecosystem } from '@security-agent/shared';

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
    newVersion: string
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
    version?: string
  ): Promise<PackageMetadata>;
}

// Made with Bob
