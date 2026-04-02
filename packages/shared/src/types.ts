/**
 * Supported package ecosystems
 */
export type Ecosystem = 'npm' | 'pip' | 'go' | 'maven';

/**
 * Severity levels for vulnerabilities
 */
export type Severity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Risk levels for fixes
 */
export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * Package information
 */
export interface Package {
  name: string;
  version: string;
  ecosystem: Ecosystem;
  isDev: boolean;
  publishDate?: Date;
}

/**
 * Vulnerability information
 */
export interface Vulnerability {
  id: string;
  cveId?: string;
  package: string;
  ecosystem: Ecosystem;
  affectedVersions: string[];
  fixedVersion?: string;
  severity: Severity;
  cvssScore?: number;
  description: string;
  references: string[];
  source: string;
  publishedDate: Date;
}

/**
 * Age validation violation
 */
export interface AgeViolation {
  package: Package;
  currentAge: number; // days since publish
  requiredAge: number; // threshold
  publishDate: Date;
  recommendation: string;
}

// Made with Bob
