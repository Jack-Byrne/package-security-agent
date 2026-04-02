# Security Agent Implementation Plan

## Project Structure

```
security-agent/
├── packages/
│   ├── core/                    # Core orchestration logic
│   │   ├── src/
│   │   │   ├── orchestrator.ts
│   │   │   ├── config.ts
│   │   │   └── types.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── package-managers/        # Package manager implementations
│   │   ├── src/
│   │   │   ├── base.ts
│   │   │   ├── npm.ts
│   │   │   ├── pip.ts
│   │   │   ├── go.ts
│   │   │   ├── maven.ts
│   │   │   └── detector.ts
│   │   └── package.json
│   │
│   ├── vulnerability-sources/   # Vulnerability data sources
│   │   ├── src/
│   │   │   ├── base.ts
│   │   │   ├── snyk.ts
│   │   │   ├── osv.ts
│   │   │   ├── github-advisory.ts
│   │   │   └── aggregator.ts
│   │   └── package.json
│   │
│   ├── scanner/                 # Vulnerability scanning engine
│   │   ├── src/
│   │   │   ├── scanner.ts
│   │   │   ├── age-validator.ts
│   │   │   ├── severity-scorer.ts
│   │   │   └── cache.ts
│   │   └── package.json
│   │
│   ├── fix-generator/           # Fix generation system
│   │   ├── src/
│   │   │   ├── base.ts
│   │   │   ├── rule-based/
│   │   │   │   ├── version-bump.ts
│   │   │   │   ├── dependency-replace.ts
│   │   │   │   └── lock-file-update.ts
│   │   │   ├── llm-powered/
│   │   │   │   ├── anthropic.ts
│   │   │   │   ├── openai.ts
│   │   │   │   └── prompt-templates.ts
│   │   │   └── strategy-selector.ts
│   │   └── package.json
│   │
│   ├── test-runner/             # Test execution framework
│   │   ├── src/
│   │   │   ├── runner.ts
│   │   │   ├── sandbox.ts
│   │   │   └── reporter.ts
│   │   └── package.json
│   │
│   ├── github-integration/      # GitHub API integration
│   │   ├── src/
│   │   │   ├── pr-creator.ts
│   │   │   ├── comment-manager.ts
│   │   │   ├── status-checks.ts
│   │   │   └── templates.ts
│   │   └── package.json
│   │
│   ├── deployments/             # Deployment configurations
│   │   ├── github-action/
│   │   │   ├── action.yml
│   │   │   ├── index.ts
│   │   │   └── package.json
│   │   ├── aws-lambda/
│   │   │   ├── handler.ts
│   │   │   ├── serverless.yml
│   │   │   └── package.json
│   │   └── cli/
│   │       ├── index.ts
│   │       └── package.json
│   │
│   └── shared/                  # Shared utilities
│       ├── src/
│       │   ├── logger.ts
│       │   ├── errors.ts
│       │   ├── http-client.ts
│       │   └── utils.ts
│       └── package.json
│
├── examples/                    # Example configurations
│   ├── javascript-project/
│   ├── python-project/
│   ├── go-project/
│   └── java-project/
│
├── docs/                        # Documentation
│   ├── getting-started.md
│   ├── configuration.md
│   ├── deployment.md
│   └── api-reference.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
│
├── package.json                 # Root package.json
├── tsconfig.json               # Root TypeScript config
├── turbo.json                  # Turborepo config
├── .eslintrc.js
├── .prettierrc
└── README.md
```

## Phase 1: Foundation (Week 1-2)

### 1.1 Project Setup

- [ ] Initialize monorepo with Turborepo
- [ ] Configure TypeScript with strict mode
- [ ] Set up ESLint and Prettier
- [ ] Configure Jest for testing
- [ ] Set up GitHub Actions for CI/CD

### 1.2 Core Types and Interfaces

```typescript
// packages/core/src/types.ts

export interface Package {
  name: string;
  version: string;
  ecosystem: "npm" | "pip" | "go" | "maven";
  isDev: boolean;
  publishDate?: Date;
}

export interface Vulnerability {
  id: string;
  cveId?: string;
  package: string;
  affectedVersions: string[];
  fixedVersion?: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  references: string[];
  source: string;
  publishedDate: Date;
}

export interface Fix {
  type: "version-bump" | "dependency-replace" | "code-change";
  package: string;
  fromVersion: string;
  toVersion: string;
  changes: FileChange[];
  breakingChanges: boolean;
  estimatedRisk: "low" | "medium" | "high";
}

export interface ScanResult {
  vulnerabilities: Vulnerability[];
  ageViolations: Package[];
  fixes: Fix[];
  timestamp: Date;
}

export interface Config {
  packageAge: {
    default: number;
    critical: number;
    dev: number;
  };
  vulnerabilitySources: string[];
  fixStrategy: {
    mode: "rule-based" | "llm" | "hybrid";
    llmProvider?: "anthropic" | "openai";
  };
  testing: {
    required: boolean;
    commands: string[];
    timeout: number;
  };
  github: {
    autoCreatePR: boolean;
    autoMerge: boolean;
    labels: string[];
  };
  excludePackages: string[];
  severityThreshold: "low" | "medium" | "high" | "critical";
}
```

### 1.3 Shared Utilities

- [ ] Logger with structured logging
- [ ] HTTP client with retry logic
- [ ] Error handling framework
- [ ] Configuration loader
- [ ] Cache implementation

## Phase 2: Package Manager Support (Week 3-4)

### 2.1 Base Package Manager Interface

```typescript
// packages/package-managers/src/base.ts

export abstract class PackageManager {
  abstract detect(repoPath: string): Promise<boolean>;
  abstract extractPackages(repoPath: string): Promise<Package[]>;
  abstract updatePackage(
    repoPath: string,
    pkg: Package,
    newVersion: string,
  ): Promise<void>;
  abstract regenerateLockFile(repoPath: string): Promise<void>;
  abstract getPackageMetadata(
    name: string,
    version: string,
  ): Promise<PackageMetadata>;
}
```

### 2.2 Implementation Priority

1. **NPM/Yarn/PNPM** (JavaScript/TypeScript)
   - Parse `package.json`
   - Handle lock files
   - Query npm registry API
2. **Pip** (Python)
   - Parse `requirements.txt`, `Pipfile`, `pyproject.toml`
   - Handle `poetry.lock`, `Pipfile.lock`
   - Query PyPI API

3. **Go Modules**
   - Parse `go.mod`, `go.sum`
   - Query Go proxy API

4. **Maven** (Java)
   - Parse `pom.xml`
   - Query Maven Central API

### 2.3 Package Age Validation

```typescript
// packages/scanner/src/age-validator.ts

export class AgeValidator {
  async validatePackage(
    pkg: Package,
    config: Config,
  ): Promise<AgeViolation | null> {
    const metadata = await this.getPackageMetadata(pkg);
    const ageInDays = this.calculateAge(metadata.publishDate);
    const threshold = this.getThreshold(pkg, config);

    if (ageInDays < threshold) {
      return {
        package: pkg,
        currentAge: ageInDays,
        requiredAge: threshold,
        publishDate: metadata.publishDate,
      };
    }

    return null;
  }
}
```

## Phase 3: Vulnerability Scanning (Week 5-6)

### 3.1 Vulnerability Source Integrations

#### Snyk Integration

```typescript
// packages/vulnerability-sources/src/snyk.ts

export class SnykSource implements VulnerabilitySource {
  async scan(packages: Package[]): Promise<Vulnerability[]> {
    const response = await this.client.post("/test", {
      packages: packages.map((p) => ({
        name: p.name,
        version: p.version,
      })),
    });

    return this.parseVulnerabilities(response.data);
  }
}
```

#### OSV.dev Integration

```typescript
// packages/vulnerability-sources/src/osv.ts

export class OSVSource implements VulnerabilitySource {
  async scan(packages: Package[]): Promise<Vulnerability[]> {
    const queries = packages.map((pkg) => ({
      package: { name: pkg.name, ecosystem: pkg.ecosystem },
      version: pkg.version,
    }));

    const response = await this.client.post("/v1/querybatch", {
      queries,
    });

    return this.parseVulnerabilities(response.data);
  }
}
```

#### GitHub Advisory Database

```typescript
// packages/vulnerability-sources/src/github-advisory.ts

export class GitHubAdvisorySource implements VulnerabilitySource {
  async scan(packages: Package[]): Promise<Vulnerability[]> {
    const query = this.buildGraphQLQuery(packages);
    const response = await this.client.post("/graphql", { query });
    return this.parseVulnerabilities(response.data);
  }
}
```

### 3.2 Vulnerability Aggregation

```typescript
// packages/vulnerability-sources/src/aggregator.ts

export class VulnerabilityAggregator {
  async aggregate(
    sources: VulnerabilitySource[],
    packages: Package[],
  ): Promise<Vulnerability[]> {
    const results = await Promise.all(
      sources.map((source) => source.scan(packages)),
    );

    // Deduplicate and merge vulnerabilities
    return this.deduplicateAndMerge(results.flat());
  }

  private deduplicateAndMerge(
    vulnerabilities: Vulnerability[],
  ): Vulnerability[] {
    // Group by CVE ID or package+version
    // Merge information from multiple sources
    // Calculate consensus severity
    // Return deduplicated list
  }
}
```

## Phase 4: Fix Generation (Week 7-8)

### 4.1 Rule-Based Fix Strategies

#### Version Bump Strategy

```typescript
// packages/fix-generator/src/rule-based/version-bump.ts

export class VersionBumpStrategy implements FixStrategy {
  canHandle(vuln: Vulnerability): boolean {
    return vuln.fixedVersion !== undefined;
  }

  async generateFix(context: FixContext): Promise<Fix> {
    const { vulnerability, package: pkg } = context;

    return {
      type: "version-bump",
      package: pkg.name,
      fromVersion: pkg.version,
      toVersion: vulnerability.fixedVersion!,
      changes: await this.generateChanges(pkg, vulnerability.fixedVersion!),
      breakingChanges: this.isBreakingChange(
        pkg.version,
        vulnerability.fixedVersion!,
      ),
      estimatedRisk: this.assessRisk(pkg, vulnerability.fixedVersion!),
    };
  }
}
```

#### Dependency Replacement Strategy

```typescript
// packages/fix-generator/src/rule-based/dependency-replace.ts

export class DependencyReplaceStrategy implements FixStrategy {
  canHandle(vuln: Vulnerability): boolean {
    return this.hasAlternativePackage(vuln.package);
  }

  async generateFix(context: FixContext): Promise<Fix> {
    const alternative = await this.findAlternative(context.package);

    return {
      type: "dependency-replace",
      package: context.package.name,
      fromVersion: context.package.version,
      toVersion: alternative.version,
      changes: await this.generateReplacementChanges(
        context.package,
        alternative,
      ),
      breakingChanges: true,
      estimatedRisk: "high",
    };
  }
}
```

### 4.2 LLM-Powered Fix Generation

#### Anthropic Integration

```typescript
// packages/fix-generator/src/llm-powered/anthropic.ts

export class AnthropicFixGenerator implements LLMFixGenerator {
  async generateFix(context: FixContext): Promise<Fix> {
    const prompt = this.buildPrompt(context);

    const response = await this.client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return this.parseLLMResponse(response);
  }

  private buildPrompt(context: FixContext): string {
    return `
You are a security expert helping to fix a vulnerability.

Vulnerability Details:
- Package: ${context.vulnerability.package}
- Current Version: ${context.package.version}
- CVE: ${context.vulnerability.cveId}
- Severity: ${context.vulnerability.severity}
- Description: ${context.vulnerability.description}

Current Code:
${context.affectedCode}

Task: Generate a fix that:
1. Updates the package to a safe version
2. Handles any breaking changes in the code
3. Maintains functionality
4. Follows best practices

Provide the fix in JSON format with file changes.
    `;
  }
}
```

### 4.3 Strategy Selection

```typescript
// packages/fix-generator/src/strategy-selector.ts

export class StrategySelector {
  selectStrategy(vulnerability: Vulnerability, config: Config): FixStrategy {
    if (config.fixStrategy.mode === "rule-based") {
      return this.selectRuleBasedStrategy(vulnerability);
    }

    if (config.fixStrategy.mode === "llm") {
      return this.selectLLMStrategy(vulnerability, config);
    }

    // Hybrid mode
    if (this.isSimpleFix(vulnerability)) {
      return this.selectRuleBasedStrategy(vulnerability);
    }

    return this.selectLLMStrategy(vulnerability, config);
  }
}
```

## Phase 5: Test Execution (Week 9)

### 5.1 Test Runner Implementation

```typescript
// packages/test-runner/src/runner.ts

export class TestRunner {
  async runTests(
    repoPath: string,
    commands: string[],
    timeout: number,
  ): Promise<TestResult> {
    const sandbox = new Sandbox(repoPath);

    try {
      await sandbox.setup();

      const results = await Promise.all(
        commands.map((cmd) => this.executeCommand(sandbox, cmd, timeout)),
      );

      return {
        success: results.every((r) => r.exitCode === 0),
        results,
        duration: results.reduce((sum, r) => sum + r.duration, 0),
      };
    } finally {
      await sandbox.cleanup();
    }
  }
}
```

### 5.2 Sandbox Environment

```typescript
// packages/test-runner/src/sandbox.ts

export class Sandbox {
  async setup(): Promise<void> {
    // Create isolated environment
    // Install dependencies
    // Set up test database if needed
  }

  async cleanup(): Promise<void> {
    // Remove temporary files
    // Clean up resources
  }
}
```

## Phase 6: GitHub Integration (Week 10)

### 6.1 PR Creation

```typescript
// packages/github-integration/src/pr-creator.ts

export class PRCreator {
  async createPR(
    repo: string,
    fixes: Fix[],
    scanResult: ScanResult,
  ): Promise<PullRequest> {
    const branch = await this.createBranch(repo, fixes);
    await this.applyFixes(repo, branch, fixes);

    const pr = await this.github.pulls.create({
      owner: repo.split("/")[0],
      repo: repo.split("/")[1],
      title: this.generateTitle(fixes),
      body: this.generateDescription(fixes, scanResult),
      head: branch,
      base: "main",
    });

    await this.addLabels(pr, ["security", "dependencies"]);
    await this.requestReviews(pr);

    return pr;
  }

  private generateDescription(fixes: Fix[], scanResult: ScanResult): string {
    return `
## Security Updates

This PR addresses ${scanResult.vulnerabilities.length} vulnerabilities.

### Vulnerabilities Fixed

${scanResult.vulnerabilities
  .map(
    (v) => `
- **${v.package}** (${v.severity})
  - CVE: ${v.cveId || "N/A"}
  - Description: ${v.description}
  - Fixed in version: ${v.fixedVersion}
`,
  )
  .join("\n")}

### Changes Made

${fixes
  .map(
    (f) => `
- Updated \`${f.package}\` from ${f.fromVersion} to ${f.toVersion}
  - Risk Level: ${f.estimatedRisk}
  - Breaking Changes: ${f.breakingChanges ? "Yes" : "No"}
`,
  )
  .join("\n")}

### Test Results

✅ All tests passed

---
*Generated by Security Agent*
    `;
  }
}
```

## Phase 7: Deployment Configurations (Week 11)

### 7.1 GitHub Action

```yaml
# packages/deployments/github-action/action.yml

name: "Security Agent"
description: "Automated security vulnerability scanning and fixing"
inputs:
  github-token:
    description: "GitHub token for API access"
    required: true
  config-path:
    description: "Path to configuration file"
    required: false
    default: ".security-agent.yml"
runs:
  using: "node20"
  main: "dist/index.js"
```

### 7.2 AWS Lambda

```typescript
// packages/deployments/aws-lambda/handler.ts

export const handler = async (event: any, context: any) => {
  const logger = new Logger({ context });

  try {
    const config = await loadConfig(event);
    const orchestrator = new Orchestrator(config, logger);

    const result = await orchestrator.run({
      repository: event.repository,
      trigger: event.trigger,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    logger.error("Execution failed", { error });
    throw error;
  }
};
```

### 7.3 CLI Tool

```typescript
// packages/deployments/cli/index.ts

#!/usr/bin/env node

import { Command } from 'commander';
import { Orchestrator } from '@security-agent/core';

const program = new Command();

program
  .name('security-agent')
  .description('AI-powered security vulnerability management')
  .version('1.0.0');

program
  .command('scan')
  .description('Scan repository for vulnerabilities')
  .option('-r, --repo <path>', 'Repository path')
  .option('-c, --config <path>', 'Config file path')
  .action(async (options) => {
    const orchestrator = new Orchestrator(options);
    await orchestrator.scan();
  });

program
  .command('fix')
  .description('Generate and apply fixes')
  .option('-r, --repo <path>', 'Repository path')
  .option('--dry-run', 'Show fixes without applying')
  .action(async (options) => {
    const orchestrator = new Orchestrator(options);
    await orchestrator.fix(options.dryRun);
  });

program.parse();
```

## Phase 8: Testing & Documentation (Week 12)

### 8.1 Testing Strategy

- Unit tests for all components (>80% coverage)
- Integration tests for workflows
- End-to-end tests with real repositories
- Performance benchmarks
- Security testing

### 8.2 Documentation

- Getting started guide
- Configuration reference
- API documentation
- Deployment guides
- Troubleshooting guide
- Contributing guidelines

## Success Metrics

### Functionality

- [ ] Successfully detects vulnerabilities across all supported languages
- [ ] Accurately validates package ages
- [ ] Generates working fixes for common vulnerabilities
- [ ] Creates valid PRs with proper descriptions
- [ ] Runs in both GitHub Actions and AWS Lambda

### Performance

- [ ] Scans complete within 5 minutes for typical projects
- [ ] Handles repositories with 100+ dependencies
- [ ] API rate limits respected
- [ ] Efficient caching reduces redundant API calls

### Quality

- [ ] 80%+ test coverage
- [ ] Zero critical security issues
- [ ] Comprehensive error handling
- [ ] Clear logging and debugging information

## Risk Mitigation

### Technical Risks

1. **API Rate Limits**: Implement caching and request throttling
2. **False Positives**: Multi-source validation and confidence scoring
3. **Breaking Changes**: Thorough testing before PR creation
4. **LLM Costs**: Hybrid approach with rule-based fallback

### Operational Risks

1. **Secrets Management**: Use secure secret stores
2. **Resource Limits**: Implement timeouts and resource constraints
3. **Monitoring**: Comprehensive logging and alerting

## Next Steps After Implementation

1. **Beta Testing**: Deploy to select repositories
2. **Feedback Collection**: Gather user feedback
3. **Iteration**: Refine based on real-world usage
4. **Documentation**: Create video tutorials
5. **Community**: Open source and build community
6. **Expansion**: Add more languages and features
