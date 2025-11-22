import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { generateWorkflowCode } from "@/lib/codegen";

export async function POST(request: NextRequest) {
  try {
    const { nodes, edges } = await request.json();

    // Generate code
    const generated = generateWorkflowCode(nodes, edges);

    if (generated.errors.length > 0) {
      return NextResponse.json(
        { success: false, errors: generated.errors },
        { status: 400 }
      );
    }

    // Write workflow definition
    const workflowsDir = path.join(process.cwd(), "workflows/definitions");
    await fs.mkdir(workflowsDir, { recursive: true });
    const workflowPath = path.join(workflowsDir, "myWorkflow.ts");
    await fs.writeFile(workflowPath, generated.workflowCode);

    // Write activities
    const activitiesDir = path.join(process.cwd(), "workflows/activities");
    await fs.mkdir(activitiesDir, { recursive: true });
    const activitiesPath = path.join(activitiesDir, "index.ts");
    await fs.writeFile(activitiesPath, generated.activityCode);

    return NextResponse.json({
      success: true,
      files: {
        workflow: workflowPath,
        activities: activitiesPath,
      },
    });
  } catch (error) {
    console.error("Error generating code:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate code" },
      { status: 500 }
    );
  }
}
