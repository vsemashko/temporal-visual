"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { WorkflowEditor } from "@/components/workflow/WorkflowEditor";

export default function Home() {
  return (
    <ReactFlowProvider>
      <main className="h-screen w-screen overflow-hidden">
        <WorkflowEditor />
      </main>
    </ReactFlowProvider>
  );
}
