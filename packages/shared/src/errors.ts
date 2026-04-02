export class SecurityAgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SecurityAgentError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class PackageManagerError extends SecurityAgentError {
  constructor(message: string, details?: any) {
    super(message, 'PACKAGE_MANAGER_ERROR', details);
    this.name = 'PackageManagerError';
  }
}

export class VulnerabilityScanError extends SecurityAgentError {
  constructor(message: string, details?: any) {
    super(message, 'VULNERABILITY_SCAN_ERROR', details);
    this.name = 'VulnerabilityScanError';
  }
}

export class ConfigurationError extends SecurityAgentError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIGURATION_ERROR', details);
    this.name = 'ConfigurationError';
  }
}

// Made with Bob
