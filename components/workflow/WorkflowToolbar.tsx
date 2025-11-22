import { Save, Download, Upload, Play, Code, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkflowStore } from "@/lib/store";
import { useState } from "react";
import { CodeViewModal } from "./CodeViewModal";

export function WorkflowToolbar() {
  const [showCodeModal, setShowCodeModal] = useState(false);
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);

  const handleSave = async () => {
    try {
      const response = await fetch("/api/workflows/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      });

      if (response.ok) {
        alert("Workflow saved successfully!");
      }
    } catch (error) {
      console.error("Failed to save workflow:", error);
      alert("Failed to save workflow");
    }
  };

  const handleExport = () => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow.json";
    a.click();
  };

  const handleGenerate = async () => {
    try {
      const response = await fetch("/api/workflows/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      });

      if (response.ok) {
        const result = await response.json();
        alert("Code generated successfully!");
        console.log(result);
      }
    } catch (error) {
      console.error("Failed to generate code:", error);
      alert("Failed to generate code");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Temporal Visual IDE</h1>
          <span className="text-sm text-muted-foreground">
            {nodes.length} nodes, {edges.length} connections
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>

          <Button variant="outline" size="sm" onClick={() => setShowCodeModal(true)}>
            <Code className="w-4 h-4 mr-2" />
            View Code
          </Button>

          <Button variant="default" size="sm" onClick={handleGenerate}>
            <Play className="w-4 h-4 mr-2" />
            Generate & Deploy
          </Button>

          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <CodeViewModal open={showCodeModal} onClose={() => setShowCodeModal(false)} />
    </>
  );
}
