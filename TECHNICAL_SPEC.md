# Security Agent Technical Specification

## API Contracts

### 1. Package Manager Interface

```typescript
interface PackageManager {
  /**
   * Detect if this package manager is used in the repository
   * @param repoPath - Absolute path to repository
   * @returns true if package manager files are found
   */
  detect(repoPath: string): Promise<boolean>;

  /**
   * Extract all packages from the repository
   * @param repoPath - Absolute path to repository
   * @returns List of packages with metadata
   */
  extractPackages(repoPath: string): Promise<Package[]>;

  /**
   * Update a package to a new version
   * @param repoPath - Absolute path to repository
   * @param packageName - Name of package to update
   * @param newVersion - Target version
   */
  updatePackage(
    repoPath: string,
    packageName: string,
    newVersion: string,
  ): Promise<void>;

  /**
   * Regenerate lock file after package updates
   * @param repoPath - Absolute path to repository
   */
  regenerateLockFile(repoPath: string): Promise<void>;

  /**
   * Get package metadata from registry
   * @param packageName - Name of package
   * @param version - Specific version (optional)
   */
  getPackageMetadata(
    packageName: string,
    version?: string,
  ): Promise<PackageMetadata>;
}
```

### 2. Vulnerability Source Interface

```typescript
interface VulnerabilitySource {
  /** Unique identifier for this source */
  readonly name: string;

  /**
   * Scan packages for vulnerabilities
   * @param packages - List of packages to scan
   * @returns List of vulnerabilities found
   */
  scan(packages: Package[]): Promise<Vulnerability[]>;

  /**
   * Get detailed information about a specific vulnerability
   * @param vulnerabilityId - CVE ID or source-specific ID
   */
  getDetails(vulnerabilityId: string): Promise<VulnerabilityDetails>;

  /**
   * Check if this source supports the given ecosystem
   * @param ecosystem - Package ecosystem (npm, pip, etc.)
   */
  supportsEcosystem(ecosystem: Ecosystem): boolean;
}
```

### 3. Fix Strategy Interface

```typescript
interface FixStrategy {
  /** Unique identifier for this strategy */
  readonly name: string;

  /**
   * Determine if this strategy can handle the vulnerability
   * @param vulnerability - Vulnerability to fix
   * @param context - Additional context
   */
  canHandle(vulnerability: Vulnerability, context: FixContext): boolean;

  /**
   * Generate a fix for the vulnerability
   * @param vulnerability - Vulnerability to fix
   * @param context - Fix generation context
   */
  generateFix(vulnerability: Vulnerability, context: FixContext): Promise<Fix>;

  /**
   * Estimate the cost of applying this fix
   * @returns Cost in arbitrary units (for LLM: API cost)
   */
  estimateCost(vulnerability: Vulnerability): number;

  /**
   * Estimate the risk level of this fix
   * @returns Risk assessment
   */
  assessRisk(vulnerability: Vulnerability, fix: Fix): RiskLevel;
}
```

## Data Models

### Core Types

```typescript
/**
 * Supported package ecosystems
 */
type Ecosystem = "npm" | "pip" | "go" | "maven";

/**
 * Severity levels for vulnerabilities
 */
type Severity = "low" | "medium" | "high" | "critical";

/**
 * Risk levels for fixes
 */
type RiskLevel = "low" | "medium" | "high";

/**
 * Fix types
 */
type FixType =
  | "version-bump"
  | "dependency-replace"
  | "code-change"
  | "configuration-update";

/**
 * Package information
 */
interface Package {
  /** Package name */
  name: string;

  /** Current version */
  version: string;

  /** Package ecosystem */
  ecosystem: Ecosystem;

  /** Whether this is a dev dependency */
  isDev: boolean;

  /** When the package version was published */
  publishDate?: Date;

  /** Package registry URL */
  registryUrl?: string;

  /** License information */
  license?: string;

  /** Number of downloads (if available) */
  downloads?: number;

  /** Maintainer information */
  maintainers?: string[];
}

/**
 * Package metadata from registry
 */
interface PackageMetadata {
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

/**
 * Vulnerability information
 */
interface Vulnerability {
  /** Unique identifier from source */
  id: string;

  /** CVE identifier (if available) */
  cveId?: string;

  /** Affected package name */
  package: string;

  /** Package ecosystem */
  ecosystem: Ecosystem;

  /** Version ranges affected */
  affectedVersions: string[];

  /** Version that fixes the vulnerability */
  fixedVersion?: string;

  /** Severity level */
  severity: Severity;

  /** CVSS score (0-10) */
  cvssScore?: number;

  /** Human-readable description */
  description: string;

  /** Reference URLs */
  references: string[];

  /** Source that reported this vulnerability */
  source: string;

  /** When the vulnerability was published */
  publishedDate: Date;

  /** When the vulnerability was last modified */
  modifiedDate?: Date;

  /** CWE identifiers */
  cweIds?: string[];

  /** Exploit availability */
  exploitAvailable?: boolean;
}

/**
 * Detailed vulnerability information
 */
interface VulnerabilityDetails extends Vulnerability {
  /** Full technical description */
  technicalDescription: string;

  /** Proof of concept code */
  poc?: string;

  /** Mitigation steps */
  mitigation: string[];

  /** Workarounds if no fix available */
  workarounds?: string[];

  /** Related vulnerabilities */
  relatedVulnerabilities?: string[];

  /** Credits */
  credits?: string[];
}

/**
 * Package age violation
 */
interface AgeViolation {
  package: Package;
  currentAge: number; // days
  requiredAge: number; // days
  publishDate: Date;
  recommendation: string;
}

/**
 * File change for a fix
 */
interface FileChange {
  /** File path relative to repo root */
  path: string;

  /** Type of change */
  type: "create" | "modify" | "delete";

  /** Original content (for modify/delete) */
  originalContent?: string;

  /** New content (for create/modify) */
  newContent?: string;

  /** Line-by-line diff */
  diff?: string;
}

/**
 * Fix for a vulnerability
 */
interface Fix {
  /** Type of fix */
  type: FixType;

  /** Package being fixed */
  package: string;

  /** Current version */
  fromVersion: string;

  /** Target version */
  toVersion: string;

  /** File changes required */
  changes: FileChange[];

  /** Whether this introduces breaking changes */
  breakingChanges: boolean;

  /** Estimated risk level */
  estimatedRisk: RiskLevel;

  /** Strategy used to generate this fix */
  strategy: string;

  /** Additional notes or warnings */
  notes?: string[];

  /** Estimated time to apply (seconds) */
  estimatedDuration?: number;
}

/**
 * Context for fix generation
 */
interface FixContext {
  /** The vulnerability to fix */
  vulnerability: Vulnerability;

  /** The affected package */
  package: Package;

  /** Repository path */
  repoPath: string;

  /** All packages in the project */
  allPackages: Package[];

  /** Code that uses the vulnerable package */
  affectedCode?: string[];

  /** Project configuration */
  config: Config;

  /** Available fix strategies */
  availableStrategies: FixStrategy[];
}

/**
 * Test execution result
 */
interface TestResult {
  /** Overall success */
  success: boolean;

  /** Individual command results */
  results: CommandResult[];

  /** Total duration in milliseconds */
  duration: number;

  /** Test coverage (if available) */
  coverage?: {
    lines: number;
    branches: number;
    functions: number;
    statements: number;
  };
}

/**
 * Individual command execution result
 */
interface CommandResult {
  /** Command that was executed */
  command: string;

  /** Exit code */
  exitCode: number;

  /** Standard output */
  stdout: string;

  /** Standard error */
  stderr: string;

  /** Execution duration in milliseconds */
  duration: number;

  /** Whether command timed out */
  timedOut: boolean;
}

/**
 * Scan result
 */
interface ScanResult {
  /** Repository information */
  repository: {
    path: string;
    url?: string;
    branch: string;
    commit: string;
  };

  /** When the scan was performed */
  timestamp: Date;

  /** Detected package managers */
  packageManagers: Ecosystem[];

  /** All packages found */
  packages: Package[];

  /** Vulnerabilities discovered */
  vulnerabilities: Vulnerability[];

  /** Package age violations */
  ageViolations: AgeViolation[];

  /** Generated fixes */
  fixes: Fix[];

  /** Scan statistics */
  statistics: {
    totalPackages: number;
    vulnerablePackages: number;
    criticalVulnerabilities: number;
    highVulnerabilities: number;
    mediumVulnerabilities: number;
    lowVulnerabilities: number;
    ageViolations: number;
    fixesGenerated: number;
  };

  /** Scan duration in milliseconds */
  duration: number;

  /** Any errors encountered */
  errors?: Error[];
}

/**
 * Pull request information
 */
interface PullRequest {
  /** PR number */
  number: number;

  /** PR title */
  title: string;

  /** PR description */
  body: string;

  /** Source branch */
  head: string;

  /** Target branch */
  base: string;

  /** PR URL */
  url: string;

  /** PR state */
  state: "open" | "closed" | "merged";

  /** Labels applied */
  labels: string[];

  /** Fixes included */
  fixes: Fix[];

  /** Test results */
  testResults?: TestResult;
}

/**
 * Configuration
 */
interface Config {
  /** Package age requirements */
  packageAge: {
    default: number;
    critical: number;
    dev: number;
  };

  /** Vulnerability sources to use */
  vulnerabilitySources: Array<"snyk" | "osv" | "github">;

  /** Fix generation strategy */
  fixStrategy: {
    mode: "rule-based" | "llm" | "hybrid";
    llmProvider?: "anthropic" | "openai";
    maxCost?: number; // Maximum cost for LLM fixes
  };

  /** Testing configuration */
  testing: {
    required: boolean;
    commands: string[];
    timeout: number; // seconds
    parallel: boolean;
  };

  /** GitHub integration */
  github: {
    autoCreatePR: boolean;
    autoMerge: boolean;
    labels: string[];
    reviewers?: string[];
    assignees?: string[];
  };

  /** Packages to exclude from scanning */
  excludePackages: string[];

  /** Minimum severity to report */
  severityThreshold: Severity;

  /** Notification settings */
  notifications?: {
    slack?: {
      webhookUrl: string;
      channel?: string;
    };
    email?: {
      recipients: string[];
      smtp?: {
        host: string;
        port: number;
        secure: boolean;
      };
    };
  };

  /** Caching configuration */
  cache?: {
    enabled: boolean;
    ttl: {
      packageMetadata: number; // seconds
      vulnerabilities: number; // seconds
    };
  };

  /** Rate limiting */
  rateLimit?: {
    maxRequestsPerMinute: number;
    maxConcurrentRequests: number;
  };
}
```

## API Endpoints (for webhook triggers)

### Webhook Handler

```typescript
/**
 * POST /webhook/snyk
 * Handle Snyk vulnerability alerts
 */
interface SnykWebhookPayload {
  event: "vulnerability_found" | "vulnerability_fixed";
  vulnerability: {
    id: string;
    package: string;
    version: string;
    severity: string;
    cve?: string;
  };
  project: {
    name: string;
    url: string;
  };
}

/**
 * POST /webhook/osv
 * Handle OSV.dev vulnerability alerts
 */
interface OSVWebhookPayload {
  id: string;
  package: {
    name: string;
    ecosystem: string;
  };
  severity: Array<{
    type: string;
    score: string;
  }>;
  affected: Array<{
    package: {
      name: string;
      ecosystem: string;
    };
    ranges: Array<{
      type: string;
      events: Array<{
        introduced?: string;
        fixed?: string;
      }>;
    }>;
  }>;
}
```

## Error Handling

```typescript
/**
 * Base error class
 */
class SecurityAgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
  ) {
    super(message);
    this.name = "SecurityAgentError";
  }
}

/**
 * Specific error types
 */
class PackageManagerError extends SecurityAgentError {
  constructor(message: string, details?: any) {
    super(message, "PACKAGE_MANAGER_ERROR", details);
  }
}

class VulnerabilityScanError extends SecurityAgentError {
  constructor(message: string, details?: any) {
    super(message, "VULNERABILITY_SCAN_ERROR", details);
  }
}

class FixGenerationError extends SecurityAgentError {
  constructor(message: string, details?: any) {
    super(message, "FIX_GENERATION_ERROR", details);
  }
}

class TestExecutionError extends SecurityAgentError {
  constructor(message: string, details?: any) {
    super(message, "TEST_EXECUTION_ERROR", details);
  }
}

class GitHubIntegrationError extends SecurityAgentError {
  constructor(message: string, details?: any) {
    super(message, "GITHUB_INTEGRATION_ERROR", details);
  }
}

class ConfigurationError extends SecurityAgentError {
  constructor(message: string, details?: any) {
    super(message, "CONFIGURATION_ERROR", details);
  }
}
```

## Logging Schema

```typescript
/**
 * Structured log entry
 */
interface LogEntry {
  /** ISO 8601 timestamp */
  timestamp: string;

  /** Log level */
  level: "debug" | "info" | "warn" | "error";

  /** Log message */
  message: string;

  /** Correlation ID for request tracking */
  correlationId: string;

  /** Component that generated the log */
  component: string;

  /** Additional context */
  context?: Record<string, any>;

  /** Error details (if level is error) */
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };

  /** Performance metrics */
  metrics?: {
    duration?: number;
    memoryUsage?: number;
    apiCalls?: number;
  };
}
```

## Performance Targets

### Response Times

- Package detection: < 1 second
- Vulnerability scan (100 packages): < 30 seconds
- Fix generation (per vulnerability): < 5 seconds
- Test execution: < 5 minutes (configurable timeout)
- PR creation: < 10 seconds

### Throughput

- Concurrent scans: 10 repositories
- API requests: 100 requests/minute (with rate limiting)
- Webhook processing: < 1 second latency

### Resource Limits

- Memory: 1 GB per scan
- CPU: 2 cores recommended
- Disk: 500 MB temporary storage
- Network: 10 MB/s bandwidth

## Security Considerations

### Authentication

```typescript
interface AuthConfig {
  github: {
    token: string; // GitHub Personal Access Token
    appId?: string; // GitHub App ID (alternative)
    privateKey?: string; // GitHub App private key
  };
  snyk?: {
    token: string;
  };
  llm?: {
    apiKey: string;
  };
}
```

### Secrets Management

- All secrets stored in environment variables or secret managers
- Never log sensitive information
- Rotate tokens regularly
- Use least-privilege access

### Code Execution Safety

- Sandbox test execution in isolated environments
- Timeout limits on all operations
- Resource constraints (CPU, memory, disk)
- No arbitrary code execution from external sources

## Monitoring Metrics

```typescript
interface Metrics {
  /** Scan metrics */
  scans: {
    total: number;
    successful: number;
    failed: number;
    averageDuration: number;
  };

  /** Vulnerability metrics */
  vulnerabilities: {
    detected: number;
    bySeverity: Record<Severity, number>;
    byEcosystem: Record<Ecosystem, number>;
  };

  /** Fix metrics */
  fixes: {
    generated: number;
    applied: number;
    successful: number;
    failed: number;
  };

  /** PR metrics */
  pullRequests: {
    created: number;
    merged: number;
    closed: number;
    averageTimeToMerge: number;
  };

  /** API metrics */
  api: {
    requests: number;
    errors: number;
    rateLimitHits: number;
    averageLatency: number;
  };

  /** Cost metrics */
  costs: {
    llmApiCalls: number;
    llmTokensUsed: number;
    estimatedCost: number;
  };
}
```

## Version Compatibility

### Node.js

- Minimum: 18.x
- Recommended: 20.x LTS

### Package Managers

- npm: >= 8.0.0
- yarn: >= 1.22.0
- pnpm: >= 7.0.0
- pip: >= 21.0.0
- go: >= 1.18
- maven: >= 3.6.0

### APIs

- GitHub API: v3 (REST) and v4 (GraphQL)
- Snyk API: v1
- OSV.dev API: v1
- Anthropic API: 2023-06-01
- OpenAI API: v1
