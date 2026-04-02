import { NpmPackageManager } from '../npm';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('NpmPackageManager', () => {
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

  describe('detect', () => {
    it('should detect npm project with package.json', async () => {
      await fs.writeFile(
        join(testDir, 'package.json'),
        JSON.stringify({ name: 'test' })
      );

      const result = await manager.detect(testDir);
      expect(result).toBe(true);
    });

    it('should not detect project without package.json', async () => {
      const result = await manager.detect(testDir);
      expect(result).toBe(false);
    });
  });

  describe('extractPackages', () => {
    it('should extract production dependencies', async () => {
      const packageJson = {
        name: 'test-project',
        dependencies: {
          express: '4.18.0',
          lodash: '4.17.21',
        },
      };

      await fs.writeFile(
        join(testDir, 'package.json'),
        JSON.stringify(packageJson)
      );

      const packages = await manager.extractPackages(testDir);

      expect(packages.length).toBeGreaterThanOrEqual(2);
      expect(packages.some((p) => p.name === 'express')).toBe(true);
      expect(packages.some((p) => p.name === 'lodash')).toBe(true);
      expect(packages.every((p) => p.ecosystem === 'npm')).toBe(true);
    });

    it('should mark dev dependencies correctly', async () => {
      const packageJson = {
        name: 'test-project',
        dependencies: {
          express: '4.18.0',
        },
        devDependencies: {
          jest: '29.0.0',
        },
      };

      await fs.writeFile(
        join(testDir, 'package.json'),
        JSON.stringify(packageJson)
      );

      const packages = await manager.extractPackages(testDir);

      const express = packages.find((p) => p.name === 'express');
      const jest = packages.find((p) => p.name === 'jest');

      expect(express?.isDev).toBe(false);
      expect(jest?.isDev).toBe(true);
    });
  });

  describe('updatePackage', () => {
    it('should update package version in package.json', async () => {
      const packageJson = {
        name: 'test-project',
        dependencies: {
          express: '4.18.0',
        },
      };

      await fs.writeFile(
        join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      await manager.updatePackage(testDir, 'express', '4.18.2');

      const updated = JSON.parse(
        await fs.readFile(join(testDir, 'package.json'), 'utf-8')
      );

      expect(updated.dependencies.express).toBe('4.18.2');
    });

    it('should throw error for non-existent package', async () => {
      const packageJson = {
        name: 'test-project',
        dependencies: {},
      };

      await fs.writeFile(
        join(testDir, 'package.json'),
        JSON.stringify(packageJson)
      );

      await expect(
        manager.updatePackage(testDir, 'nonexistent', '1.0.0')
      ).rejects.toThrow();
    });
  });

  describe('getPackageMetadata', () => {
    it('should fetch package metadata from npm registry', async () => {
      const metadata = await manager.getPackageMetadata('express');

      expect(metadata.name).toBe('express');
      expect(metadata.latestVersion).toBeTruthy();
      expect(Object.keys(metadata.versions).length).toBeGreaterThan(0);
    });

    it('should handle non-existent packages', async () => {
      await expect(
        manager.getPackageMetadata(
          'this-package-definitely-does-not-exist-12345'
        )
      ).rejects.toThrow();
    });
  });
});

// Made with Bob
