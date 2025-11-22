import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const workflowsDir = path.join(process.cwd(), "workflows");

    // Count workflows
    const definitionsDir = path.join(workflowsDir, "definitions");
    const activitiesDir = path.join(workflowsDir, "activities");
    const metadataDir = path.join(workflowsDir, "metadata");

    let workflowCount = 0;
    let activityCount = 0;
    let metadataCount = 0;

    try {
      const definitions = await fs.readdir(definitionsDir);
      workflowCount = definitions.filter((f) => f.endsWith(".ts")).length;
    } catch (error) {
      // Directory might not exist yet
    }

    try {
      const activities = await fs.readdir(activitiesDir);
      activityCount = activities.filter((f) => f.endsWith(".ts")).length;
    } catch (error) {
      // Directory might not exist yet
    }

    try {
      const metadata = await fs.readdir(metadataDir);
      metadataCount = metadata.filter((f) => f.endsWith(".json")).length;
    } catch (error) {
      // Directory might not exist yet
    }

    return NextResponse.json({
      status: "ok",
      environment: process.env.NODE_ENV || "development",
      workflows: {
        definitions: workflowCount,
        activities: activityCount,
        metadata: metadataCount,
      },
      temporal: {
        address: process.env.TEMPORAL_ADDRESS || "localhost:7233",
        taskQueue: process.env.TEMPORAL_TASK_QUEUE || "temporal-visual",
      },
      litellm: {
        proxyUrl: process.env.LITELLM_PROXY_URL || "http://localhost:4000",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", error: error.message },
      { status: 500 }
    );
  }
}
