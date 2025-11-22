/**
 * Worker Versioning Configuration
 *
 * Temporal Worker Versioning allows you to deploy workflow code changes
 * without breaking running workflows.
 */

export interface VersionConfig {
  buildId: string;
  enabled: boolean;
  useVersioning: boolean;
}

export function getVersionConfig(): VersionConfig {
  const env = process.env.NODE_ENV || "development";
  const gitCommit = process.env.GIT_COMMIT || "local";
  const buildNumber = process.env.BUILD_NUMBER || Date.now().toString();

  // In development, use simple versioning
  if (env === "development") {
    return {
      buildId: `dev-${buildNumber}`,
      enabled: false, // Disable versioning in dev for faster iteration
      useVersioning: false,
    };
  }

  // In production, enable versioning
  return {
    buildId: `${gitCommit}-${buildNumber}`,
    enabled: true,
    useVersioning: true,
  };
}

export function getWorkerOptions(baseOptions: any) {
  const versionConfig = getVersionConfig();

  if (!versionConfig.enabled) {
    return baseOptions;
  }

  return {
    ...baseOptions,
    useVersioning: versionConfig.useVersioning,
    buildId: versionConfig.buildId,
  };
}
