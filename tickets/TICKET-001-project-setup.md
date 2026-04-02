# TICKET-001: Project Setup and Foundation

## Context

You are setting up a new TypeScript monorepo project called "Security Agent" - an AI-powered system that detects and fixes supply chain vulnerabilities in software projects. This is the foundational ticket that establishes the project structure.

## Objective

Create a TypeScript monorepo using Turborepo with proper tooling, configuration, and initial package structure.

## Prerequisites

- Node.js 20.x or later
- npm 8.x or later
- Git

## Tasks

### 1. Initialize Monorepo

Create the root project structure:

```bash
# Initialize root package.json
npm init -y

# Install Turborepo
npm install turbo --save-dev

# Install TypeScript and tooling
npm install typescript @types/node --save-dev
npm install eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin --save-dev
npm install prettier eslint-config-prettier --save-dev
npm install jest @types/jest ts-jest --save-dev
```

### 2. Create Root Configuration Files

#### `package.json`

```json
{
  "name": "security-agent",
  "version": "0.1.0",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "clean": "turbo run clean",
    "dev": "turbo run dev"
  },
  "devDependencies": {
    "turbo": "^1.10.0",
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0",
    "eslint": "^8.50.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "prettier": "^3.0.0",
    "eslint-config-prettier": "^9.0.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0",
    "ts-jest": "^29.1.0"
  }
}
```

#### `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

#### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "exclude": ["node_modules", "dist"]
}
```

#### `.eslintrc.js`

```javascript
module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
  },
};
```

#### `.prettierrc`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

#### `jest.config.js`

```javascript
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/packages"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  collectCoverageFrom: [
    "packages/**/src/**/*.ts",
    "!packages/**/src/**/*.d.ts",
    "!packages/**/src/**/__tests__/**",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### 3. Create Initial Package Structure

Create these directories:

```
packages/
├── core/
├── shared/
├── package-managers/
├── vulnerability-sources/
├── scanner/
├── fix-generator/
├── test-runner/
├── github-integration/
└── deployments/
```

### 4. Create Shared Package

#### `packages/shared/package.json`

```json
{
  "name": "@security-agent/shared",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src --ext .ts",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0"
  }
}
```

#### `packages/shared/tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

#### `packages/shared/src/index.ts`

```typescript
export * from "./logger";
export * from "./errors";
export * from "./types";
```

#### `packages/shared/src/types.ts`

```typescript
/**
 * Supported package ecosystems
 */
export type Ecosystem = "npm" | "pip" | "go" | "maven";

/**
 * Severity levels for vulnerabilities
 */
export type Severity = "low" | "medium" | "high" | "critical";

/**
 * Risk levels for fixes
 */
export type RiskLevel = "low" | "medium" | "high";

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
```

#### `packages/shared/src/logger.ts`

```typescript
import winston from "winston";

export interface LogContext {
  correlationId?: string;
  component?: string;
  [key: string]: any;
}

export class Logger {
  private logger: winston.Logger;

  constructor(private defaultContext: LogContext = {}) {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      ],
    });
  }

  private log(level: string, message: string, context?: LogContext) {
    this.logger.log(level, message, {
      ...this.defaultContext,
      ...context,
    });
  }

  debug(message: string, context?: LogContext) {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext) {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log("warn", message, context);
  }

  error(message: string, context?: LogContext) {
    this.log("error", message, context);
  }
}
```

#### `packages/shared/src/errors.ts`

```typescript
export class SecurityAgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
  ) {
    super(message);
    this.name = "SecurityAgentError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class PackageManagerError extends SecurityAgentError {
  constructor(message: string, details?: any) {
    super(message, "PACKAGE_MANAGER_ERROR", details);
    this.name = "PackageManagerError";
  }
}

export class VulnerabilityScanError extends SecurityAgentError {
  constructor(message: string, details?: any) {
    super(message, "VULNERABILITY_SCAN_ERROR", details);
    this.name = "VulnerabilityScanError";
  }
}

export class ConfigurationError extends SecurityAgentError {
  constructor(message: string, details?: any) {
    super(message, "CONFIGURATION_ERROR", details);
    this.name = "ConfigurationError";
  }
}
```

### 5. Create Core Package Stub

#### `packages/core/package.json`

```json
{
  "name": "@security-agent/core",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src --ext .ts",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@security-agent/shared": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0"
  }
}
```

#### `packages/core/tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

#### `packages/core/src/index.ts`

```typescript
export const VERSION = "0.1.0";
```

### 6. Create .gitignore

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
*.lcov

# Build outputs
dist/
build/
*.tsbuildinfo

# Environment
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Turbo
.turbo/
```

### 7. Create README.md

```markdown
# Security Agent

AI-powered security vulnerability management for software projects.

## Setup

\`\`\`bash
npm install
npm run build
npm test
\`\`\`

## Project Structure

- `packages/core` - Core orchestration logic
- `packages/shared` - Shared utilities and types
- `packages/package-managers` - Package manager implementations
- `packages/vulnerability-sources` - Vulnerability data sources
- `packages/scanner` - Vulnerability scanning engine
- `packages/fix-generator` - Fix generation system
- `packages/test-runner` - Test execution framework
- `packages/github-integration` - GitHub API integration
- `packages/deployments` - Deployment configurations

## Development

\`\`\`bash

# Build all packages

npm run build

# Run tests

npm test

# Run linting

npm run lint

# Clean build artifacts

npm run clean
\`\`\`
```

## Acceptance Criteria

### ✅ Validation Steps

Run these commands to verify the setup is correct:

1. **Project initializes successfully**

   ```bash
   npm install
   ```

   Expected: No errors, all dependencies installed

2. **TypeScript compiles successfully**

   ```bash
   npm run build
   ```

   Expected:
   - Exit code 0
   - `packages/shared/dist/` directory created
   - `packages/core/dist/` directory created
   - Files: `index.js`, `index.d.ts`, `logger.js`, `errors.js`, `types.js`

3. **Linting passes**

   ```bash
   npm run lint
   ```

   Expected: Exit code 0, no linting errors

4. **Tests can run**

   ```bash
   npm test
   ```

   Expected: Exit code 0 (even if no tests yet)

5. **Shared package exports work**

   ```bash
   node -e "const shared = require('./packages/shared/dist/index.js'); console.log(typeof shared.Logger)"
   ```

   Expected: Output `function`

6. **Directory structure is correct**

   ```bash
   ls -la packages/
   ```

   Expected: All 9 package directories exist

7. **Git repository is initialized**
   ```bash
   git status
   ```
   Expected: Shows untracked files, .gitignore working

### 📋 Checklist

- [ ] Root `package.json` created with workspaces
- [ ] `turbo.json` configured
- [ ] TypeScript configuration files created
- [ ] ESLint and Prettier configured
- [ ] Jest configured
- [ ] All 9 package directories created
- [ ] `@security-agent/shared` package implemented with Logger, errors, and types
- [ ] `@security-agent/core` package stub created
- [ ] `.gitignore` created
- [ ] README.md created
- [ ] `npm install` runs successfully
- [ ] `npm run build` completes without errors
- [ ] `npm run lint` passes
- [ ] `npm test` runs (even with no tests)

## Success Metrics

- ✅ All commands in validation steps return expected results
- ✅ Build produces JavaScript and declaration files
- ✅ No TypeScript compilation errors
- ✅ No linting errors
- ✅ Project structure matches specification

## Next Steps

After completing this ticket, proceed to:

- **TICKET-002**: Implement NPM Package Manager Support

## Reference Documents

- `ARCHITECTURE.md` - System architecture overview
- `TECHNICAL_SPEC.md` - API contracts and data models
- `IMPLEMENTATION_PLAN.md` - Full development roadmap
