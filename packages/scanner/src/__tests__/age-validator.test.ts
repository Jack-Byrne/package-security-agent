import { AgeValidator } from '../age-validator';
import { Package } from '@security-agent/shared';
import {
  PackageManager,
  PackageMetadata,
} from '@security-agent/package-managers';

// Mock PackageManager
class MockPackageManager implements PackageManager {
  readonly ecosystem = 'npm' as const;
  private mockMetadata: Map<string, PackageMetadata> = new Map();

  async detect(): Promise<boolean> {
    return true;
  }

  async extractPackages(): Promise<Package[]> {
    return [];
  }

  async updatePackage(): Promise<void> {}

  async regenerateLockFile(): Promise<void> {}

  async getPackageMetadata(
    packageName: string,
    version?: string
  ): Promise<PackageMetadata> {
    const key = version ? `${packageName}@${version}` : packageName;
    const metadata = this.mockMetadata.get(key);
    if (!metadata) {
      throw new Error(`Package ${key} not found`);
    }
    return metadata;
  }

  setMockMetadata(packageName: string, version: string, publishDate: Date) {
    const key = `${packageName}@${version}`;
    this.mockMetadata.set(key, {
      name: packageName,
      versions: {
        [version]: {
          publishDate,
          deprecated: false,
        },
      },
      latestVersion: version,
      downloads: { lastMonth: 1000, lastWeek: 250 },
      maintainers: [],
    });
  }
}

describe('AgeValidator', () => {
  let validator: AgeValidator;
  let packageManager: MockPackageManager;

  beforeEach(() => {
    validator = new AgeValidator();
    packageManager = new MockPackageManager();
  });

  describe('validatePackage', () => {
    it('should return null for packages older than threshold', async () => {
      const pkg: Package = {
        name: 'old-package',
        version: '1.0.0',
        ecosystem: 'npm',
        isDev: false,
      };

      // Package published 30 days ago (older than default 14 days)
      const publishDate = new Date();
      publishDate.setDate(publishDate.getDate() - 30);
      packageManager.setMockMetadata(pkg.name, pkg.version, publishDate);

      const result = await validator.validatePackage(pkg, packageManager);
      expect(result).toBeNull();
    });

    it('should return violation for packages newer than threshold', async () => {
      const pkg: Package = {
        name: 'new-package',
        version: '1.0.0',
        ecosystem: 'npm',
        isDev: false,
      };

      // Package published 5 days ago (newer than default 14 days)
      const publishDate = new Date();
      publishDate.setDate(publishDate.getDate() - 5);
      packageManager.setMockMetadata(pkg.name, pkg.version, publishDate);

      const result = await validator.validatePackage(pkg, packageManager);
      expect(result).not.toBeNull();
      expect(result?.package).toBe(pkg);
      expect(result?.currentAge).toBe(5);
      expect(result?.requiredAge).toBe(14);
      expect(result?.recommendation).toContain('Wait 9 more days');
    });

    it('should use dev threshold for dev dependencies', async () => {
      const pkg: Package = {
        name: 'dev-package',
        version: '1.0.0',
        ecosystem: 'npm',
        isDev: true,
      };

      // Package published 5 days ago (newer than dev threshold of 7 days)
      const publishDate = new Date();
      publishDate.setDate(publishDate.getDate() - 5);
      packageManager.setMockMetadata(pkg.name, pkg.version, publishDate);

      const result = await validator.validatePackage(pkg, packageManager);
      expect(result).not.toBeNull();
      expect(result?.requiredAge).toBe(7);
      expect(result?.recommendation).toContain('dev dependency');
    });

    it('should return null for dev packages older than dev threshold', async () => {
      const pkg: Package = {
        name: 'old-dev-package',
        version: '1.0.0',
        ecosystem: 'npm',
        isDev: true,
      };

      // Package published 10 days ago (older than dev threshold of 7 days)
      const publishDate = new Date();
      publishDate.setDate(publishDate.getDate() - 10);
      packageManager.setMockMetadata(pkg.name, pkg.version, publishDate);

      const result = await validator.validatePackage(pkg, packageManager);
      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const pkg: Package = {
        name: 'missing-package',
        version: '1.0.0',
        ecosystem: 'npm',
        isDev: false,
      };

      // Don't set mock metadata, so it will throw an error
      const result = await validator.validatePackage(pkg, packageManager);
      expect(result).toBeNull();
    });
  });

  describe('validateBatch', () => {
    it('should validate multiple packages', async () => {
      const packages: Package[] = [
        {
          name: 'old-package',
          version: '1.0.0',
          ecosystem: 'npm',
          isDev: false,
        },
        {
          name: 'new-package',
          version: '1.0.0',
          ecosystem: 'npm',
          isDev: false,
        },
        {
          name: 'another-new-package',
          version: '2.0.0',
          ecosystem: 'npm',
          isDev: true,
        },
      ];

      // Old package (30 days)
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 30);
      packageManager.setMockMetadata(
        packages[0].name,
        packages[0].version,
        oldDate
      );

      // New package (5 days)
      const newDate = new Date();
      newDate.setDate(newDate.getDate() - 5);
      packageManager.setMockMetadata(
        packages[1].name,
        packages[1].version,
        newDate
      );

      // Another new package (3 days)
      const anotherNewDate = new Date();
      anotherNewDate.setDate(anotherNewDate.getDate() - 3);
      packageManager.setMockMetadata(
        packages[2].name,
        packages[2].version,
        anotherNewDate
      );

      const violations = await validator.validateBatch(
        packages,
        packageManager
      );
      expect(violations).toHaveLength(2);
      expect(violations[0].package.name).toBe('new-package');
      expect(violations[1].package.name).toBe('another-new-package');
    });

    it('should return empty array when all packages are old enough', async () => {
      const packages: Package[] = [
        {
          name: 'old-package-1',
          version: '1.0.0',
          ecosystem: 'npm',
          isDev: false,
        },
        {
          name: 'old-package-2',
          version: '1.0.0',
          ecosystem: 'npm',
          isDev: false,
        },
      ];

      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 30);
      packageManager.setMockMetadata(
        packages[0].name,
        packages[0].version,
        oldDate
      );
      packageManager.setMockMetadata(
        packages[1].name,
        packages[1].version,
        oldDate
      );

      const violations = await validator.validateBatch(
        packages,
        packageManager
      );
      expect(violations).toHaveLength(0);
    });
  });

  describe('getThreshold', () => {
    it('should return dev threshold for dev dependencies', () => {
      const pkg: Package = {
        name: 'test',
        version: '1.0.0',
        ecosystem: 'npm',
        isDev: true,
      };
      expect(validator.getThreshold(pkg)).toBe(7);
    });

    it('should return default threshold for production dependencies', () => {
      const pkg: Package = {
        name: 'test',
        version: '1.0.0',
        ecosystem: 'npm',
        isDev: false,
      };
      expect(validator.getThreshold(pkg)).toBe(14);
    });
  });

  describe('custom thresholds', () => {
    it('should use custom thresholds when provided', () => {
      const customValidator = new AgeValidator({
        thresholds: {
          default: 21,
          dev: 10,
          critical: 45,
        },
      });

      const prodPkg: Package = {
        name: 'test',
        version: '1.0.0',
        ecosystem: 'npm',
        isDev: false,
      };
      expect(customValidator.getThreshold(prodPkg)).toBe(21);

      const devPkg: Package = {
        name: 'test',
        version: '1.0.0',
        ecosystem: 'npm',
        isDev: true,
      };
      expect(customValidator.getThreshold(devPkg)).toBe(10);
    });
  });

  describe('caching', () => {
    it('should cache package metadata', async () => {
      const pkg: Package = {
        name: 'cached-package',
        version: '1.0.0',
        ecosystem: 'npm',
        isDev: false,
      };

      const publishDate = new Date();
      publishDate.setDate(publishDate.getDate() - 30);
      packageManager.setMockMetadata(pkg.name, pkg.version, publishDate);

      // First call
      await validator.validatePackage(pkg, packageManager);

      // Second call should use cache
      await validator.validatePackage(pkg, packageManager);

      const stats = validator.getCacheStats();
      expect(stats.size).toBe(1);
    });

    it('should clear cache', async () => {
      const pkg: Package = {
        name: 'cached-package',
        version: '1.0.0',
        ecosystem: 'npm',
        isDev: false,
      };

      const publishDate = new Date();
      publishDate.setDate(publishDate.getDate() - 30);
      packageManager.setMockMetadata(pkg.name, pkg.version, publishDate);

      await validator.validatePackage(pkg, packageManager);
      expect(validator.getCacheStats().size).toBe(1);

      validator.clearCache();
      expect(validator.getCacheStats().size).toBe(0);
    });

    it('should respect cache TTL', async () => {
      const shortTTLValidator = new AgeValidator({
        cacheTTL: 100, // 100ms
      });

      const pkg: Package = {
        name: 'ttl-package',
        version: '1.0.0',
        ecosystem: 'npm',
        isDev: false,
      };

      const publishDate = new Date();
      publishDate.setDate(publishDate.getDate() - 30);
      packageManager.setMockMetadata(pkg.name, pkg.version, publishDate);

      // First call
      await shortTTLValidator.validatePackage(pkg, packageManager);

      // Wait for cache to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Second call should fetch again (cache expired)
      await shortTTLValidator.validatePackage(pkg, packageManager);

      // Cache should still have the entry (refreshed)
      expect(shortTTLValidator.getCacheStats().size).toBe(1);
    });
  });
});

// Made with Bob
