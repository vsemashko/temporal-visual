import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    checks: {
      server: "ok",
      filesystem: "checking",
      workflows: "checking",
    },
  };

  try {
    // Check filesystem access
    const workflowsDir = path.join(process.cwd(), "workflows");
    await fs.access(workflowsDir);
    health.checks.filesystem = "ok";

    // Check if workflow directories exist
    const dirs = ["definitions", "activities", "metadata", "config"];
    for (const dir of dirs) {
      await fs.access(path.join(workflowsDir, dir));
    }
    health.checks.workflows = "ok";

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    health.status = "unhealthy";
    health.checks.filesystem = "error";
    return NextResponse.json(health, { status: 503 });
  }
}
