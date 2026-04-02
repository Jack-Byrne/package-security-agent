import { AgeValidator } from '../age-validator';
import { Package } from '@security-agent/shared';
import {
  PackageManager,
  PackageMetadata,
} from '@security-agent/package-managers';

// Mock PackageManager for performance testing
class MockPackageManager implements PackageManager {
  readonly ecosystem = 'npm' as const;
  private callCount = 0;

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
    this.callCount++;
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 10));

    const publishDate = new Date();
    publishDate.setDate(publishDate.getDate() - 30);

    return {
      name: packageName,
      versions: {
        [version || '1.0.0']: {
          publishDate,
          deprecated: false,
        },
      },
      latestVersion: version || '1.0.0',
      downloads: { lastMonth: 1000, lastWeek: 250 },
      maintainers: [],
    };
  }

  getCallCount(): number {
    return this.callCount;
  }

  resetCallCount(): void {
    this.callCount = 0;
  }
}

describe('AgeValidator Performance', () => {
  let validator: AgeValidator;
  let packageManager: MockPackageManager;

  beforeEach(() => {
    validator = new AgeValidator();
    packageManager = new MockPackageManager();
  });

  it('should validate 100 packages in < 10 seconds with cache', async () => {
    // Create 100 packages
    const packages: Package[] = [];
    for (let i = 0; i < 100; i++) {
      packages.push({
        name: `package-${i}`,
        version: '1.0.0',
        ecosystem: 'npm',
        isDev: i % 2 === 0,
      });
    }

    const startTime = Date.now();
    await validator.validateBatch(packages, packageManager);
    const endTime = Date.now();

    const duration = endTime - startTime;
    expect(duration).toBeLessThan(10000); // Less than 10 seconds

    // Verify all packages were processed
    expect(packageManager.getCallCount()).toBe(100);
  }, 15000); // Set test timeout to 15 seconds

  it('should have cache hit rate > 80% on repeated scans', async () => {
    const packages: Package[] = [];
    for (let i = 0; i < 20; i++) {
      packages.push({
        name: `package-${i}`,
        version: '1.0.0',
        ecosystem: 'npm',
        isDev: false,
      });
    }

    // First scan - all cache misses
    await validator.validateBatch(packages, packageManager);
    const firstScanCalls = packageManager.getCallCount();
    expect(firstScanCalls).toBe(20);

    packageManager.resetCallCount();

    // Second scan - should use cache
    await validator.validateBatch(packages, packageManager);
    const secondScanCalls = packageManager.getCallCount();

    // Cache hit rate should be 100% (0 new calls)
    const cacheHitRate = ((20 - secondScanCalls) / 20) * 100;
    expect(cacheHitRate).toBeGreaterThanOrEqual(80);
  });
});

// Made with Bob
