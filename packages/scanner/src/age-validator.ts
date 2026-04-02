import {
  Package,
  AgeViolation,
  Logger,
  PackageManagerError,
} from '@security-agent/shared';
import { PackageManager } from '@security-agent/package-managers';

interface CacheEntry {
  publishDate: Date;
  timestamp: number;
}

interface AgeThresholds {
  default: number; // days
  critical: number; // days
  dev: number; // days
}

export interface AgeValidatorConfig {
  thresholds?: Partial<AgeThresholds>;
  cacheTTL?: number; // milliseconds
}

export class AgeValidator {
  private logger: Logger;
  private cache: Map<string, CacheEntry>;
  private thresholds: AgeThresholds;
  private cacheTTL: number;

  constructor(config: AgeValidatorConfig = {}) {
    this.logger = new Logger({ component: 'AgeValidator' });
    this.cache = new Map();
    this.thresholds = {
      default: 14,
      critical: 30,
      dev: 7,
      ...config.thresholds,
    };
    this.cacheTTL = config.cacheTTL ?? 3600000; // 1 hour default
  }

  /**
   * Validate a single package against age requirements
   */
  async validatePackage(
    pkg: Package,
    packageManager: PackageManager
  ): Promise<AgeViolation | null> {
    this.logger.debug('Validating package age', {
      package: pkg.name,
      version: pkg.version,
    });

    try {
      const publishDate = await this.getPublishDate(pkg, packageManager);
      const currentAge = this.calculateAge(publishDate);
      const requiredAge = this.getThreshold(pkg);

      if (currentAge < requiredAge) {
        return {
          package: pkg,
          currentAge,
          requiredAge,
          publishDate,
          recommendation: this.generateRecommendation(
            pkg,
            currentAge,
            requiredAge
          ),
        };
      }

      return null;
    } catch (error) {
      this.logger.warn('Failed to validate package age', {
        package: pkg.name,
        error: (error as Error).message,
      });
      // Don't fail the entire scan for one package
      return null;
    }
  }

  /**
   * Validate multiple packages in batch
   */
  async validateBatch(
    packages: Package[],
    packageManager: PackageManager
  ): Promise<AgeViolation[]> {
    this.logger.info('Validating package ages in batch', {
      count: packages.length,
    });

    const violations: AgeViolation[] = [];
    const validationPromises = packages.map((pkg) =>
      this.validatePackage(pkg, packageManager)
    );

    const results = await Promise.all(validationPromises);

    for (const result of results) {
      if (result !== null) {
        violations.push(result);
      }
    }

    this.logger.info('Batch validation complete', {
      total: packages.length,
      violations: violations.length,
      cacheHits: this.getCacheStats().hits,
    });

    return violations;
  }

  /**
   * Get the age threshold for a package
   */
  getThreshold(pkg: Package): number {
    // Dev dependencies have lower threshold
    if (pkg.isDev) {
      return this.thresholds.dev;
    }

    // Check if package is critical (could be extended with more logic)
    // For now, use default threshold
    return this.thresholds.default;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hits: number } {
    return {
      size: this.cache.size,
      hits: 0, // Would need to track this separately
    };
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.debug('Cache cleared');
  }

  /**
   * Get publish date for a package (with caching)
   */
  private async getPublishDate(
    pkg: Package,
    packageManager: PackageManager
  ): Promise<Date> {
    const cacheKey = `${pkg.name}@${pkg.version}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      this.logger.debug('Cache hit', { package: cacheKey });
      return cached.publishDate;
    }

    // Fetch from registry
    this.logger.debug('Cache miss, fetching from registry', {
      package: cacheKey,
    });

    const metadata = await packageManager.getPackageMetadata(
      pkg.name,
      pkg.version
    );

    const versionInfo = metadata.versions[pkg.version];
    if (!versionInfo) {
      throw new PackageManagerError(
        `Version ${pkg.version} not found for package ${pkg.name}`,
        { package: pkg.name, version: pkg.version }
      );
    }

    const publishDate = versionInfo.publishDate;

    // Update cache
    this.cache.set(cacheKey, {
      publishDate,
      timestamp: Date.now(),
    });

    return publishDate;
  }

  /**
   * Calculate age in days
   */
  private calculateAge(publishDate: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - publishDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Generate recommendation message
   */
  private generateRecommendation(
    pkg: Package,
    currentAge: number,
    requiredAge: number
  ): string {
    const daysRemaining = requiredAge - currentAge;
    const packageType = pkg.isDev ? 'dev dependency' : 'production dependency';

    return (
      `Package ${pkg.name}@${pkg.version} was published ${currentAge} days ago. ` +
      `Wait ${daysRemaining} more days before using this ${packageType} ` +
      `(minimum age: ${requiredAge} days). This helps protect against supply chain attacks ` +
      `targeting newly published packages.`
    );
  }
}

// Made with Bob
