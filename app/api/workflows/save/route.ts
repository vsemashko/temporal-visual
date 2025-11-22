import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const { nodes, edges } = await request.json();

    const workflowsDir = path.join(process.cwd(), "workflows/metadata");
    await fs.mkdir(workflowsDir, { recursive: true });

    const metadata = {
      id: "workflow_" + Date.now(),
      name: "My Workflow",
      version: "1.0.0",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes,
      edges,
    };

    const filePath = path.join(workflowsDir, `${metadata.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2));

    return NextResponse.json({
      success: true,
      workflowId: metadata.id,
    });
  } catch (error) {
    console.error("Error saving workflow:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save workflow" },
      { status: 500 }
    );
  }
}
