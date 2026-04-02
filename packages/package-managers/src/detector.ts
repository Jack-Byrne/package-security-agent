import { Logger } from '@security-agent/shared';
import { PackageManager } from './base';
import { NpmPackageManager } from './npm';

export class PackageManagerDetector {
  private logger: Logger;
  private managers: PackageManager[];

  constructor() {
    this.logger = new Logger({ component: 'PackageManagerDetector' });
    this.managers = [new NpmPackageManager()];
  }

  async detectAll(repoPath: string): Promise<PackageManager[]> {
    this.logger.info('Detecting package managers', { repoPath });

    const detected: PackageManager[] = [];

    for (const manager of this.managers) {
      if (await manager.detect(repoPath)) {
        this.logger.info('Detected package manager', {
          ecosystem: manager.ecosystem,
        });
        detected.push(manager);
      }
    }

    if (detected.length === 0) {
      this.logger.warn('No package managers detected', { repoPath });
    }

    return detected;
  }

  async detectFirst(repoPath: string): Promise<PackageManager | null> {
    const detected = await this.detectAll(repoPath);
    return detected[0] || null;
  }
}

// Made with Bob
