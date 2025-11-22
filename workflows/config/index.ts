export interface TimeoutConfig {
  activityTimeout: string;
  workflowTimeout: string;
  retryAttempts: number;
  heartbeatTimeout?: string;
}

const developmentConfig: TimeoutConfig = {
  activityTimeout: "5s",
  workflowTimeout: "1m",
  retryAttempts: 1,
  heartbeatTimeout: "2s",
};

const productionConfig: TimeoutConfig = {
  activityTimeout: "5m",
  workflowTimeout: "24h",
  retryAttempts: 3,
  heartbeatTimeout: "30s",
};

export function getConfig(): TimeoutConfig {
  const env = process.env.NODE_ENV || "development";
  return env === "production" ? productionConfig : developmentConfig;
}

export function getTimeouts(type: "activity" | "workflow") {
  const config = getConfig();

  if (type === "activity") {
    return {
      startToCloseTimeout: config.activityTimeout,
      heartbeatTimeout: config.heartbeatTimeout,
      retry: {
        maximumAttempts: config.retryAttempts,
      },
    };
  }

  return {
    workflowExecutionTimeout: config.workflowTimeout,
  };
}
