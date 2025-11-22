import { Save, Download, Upload, Play, Code, Settings, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkflowStore } from "@/lib/store";
import { useState, useRef } from "react";
import { CodeViewModal } from "./CodeViewModal";
import { useToast } from "@/components/ui/toast";
import { validateWorkflow, getValidationSummary } from "@/lib/validation";

export function WorkflowToolbar() {
  const [showCodeModal, setShowCodeModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const setNodes = useWorkflowStore((state) => state.setNodes);
  const setEdges = useWorkflowStore((state) => state.setEdges);

  const validation = validateWorkflow(nodes, edges);

  const handleSave = async () => {
    try {
      const response = await fetch("/api/workflows/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      });

      if (response.ok) {
        const result = await response.json();
        addToast(`Workflow saved: ${result.workflowId}`, "success");
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      console.error("Failed to save workflow:", error);
      addToast("Failed to save workflow", "error");
    }
  };

  const handleExport = () => {
    try {
      const data = JSON.stringify({ nodes, edges }, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "workflow.json";
      a.click();
      addToast("Workflow exported successfully", "success");
    } catch (error) {
      addToast("Failed to export workflow", "error");
    }
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (data.nodes && data.edges) {
          setNodes(data.nodes);
          setEdges(data.edges);
          addToast("Workflow imported successfully", "success");
        } else {
          addToast("Invalid workflow file format", "error");
        }
      } catch (error) {
        console.error("Failed to import workflow:", error);
        addToast("Failed to parse workflow file", "error");
      }
    };
    reader.readAsText(file);

    // Reset input
    event.target.value = "";
  };

  const handleValidate = () => {
    const result = validateWorkflow(nodes, edges);

    if (result.errors.length > 0) {
      result.errors.forEach((error) => {
        addToast(error.message, "error", 7000);
      });
    }

    if (result.warnings.length > 0) {
      result.warnings.forEach((warning) => {
        addToast(warning.message, "warning", 7000);
      });
    }

    if (result.isValid && result.warnings.length === 0) {
      addToast("✅ Workflow validation passed!", "success");
    }
  };

  const handleGenerate = async () => {
    // Validate first
    const result = validateWorkflow(nodes, edges);

    if (!result.isValid) {
      addToast(`Validation failed: ${result.errors.length} error(s)`, "error");
      result.errors.forEach((error) => {
        addToast(error.message, "error", 7000);
      });
      return;
    }

    // Show warnings but continue
    if (result.warnings.length > 0) {
      result.warnings.forEach((warning) => {
        addToast(warning.message, "warning", 5000);
      });
    }

    try {
      addToast("Generating workflow code...", "info");

      const response = await fetch("/api/workflows/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      });

      if (response.ok) {
        const result = await response.json();
        addToast("Code generated and deployed successfully!", "success");
        console.log("Generated files:", result);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Generation failed");
      }
    } catch (error: any) {
      console.error("Failed to generate code:", error);
      addToast(error.message || "Failed to generate code", "error");
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
          <div className="flex items-center gap-1 text-xs">
            {validation.isValid ? (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-3 h-3" />
                Valid
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600">
                <AlertTriangle className="w-3 h-3" />
                {validation.errors.length} error(s)
              </span>
            )}
            {validation.warnings.length > 0 && (
              <span className="text-yellow-600">
                , {validation.warnings.length} warning(s)
              </span>
            )}
          </div>
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

          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          <Button variant="outline" size="sm" onClick={() => setShowCodeModal(true)}>
            <Code className="w-4 h-4 mr-2" />
            View Code
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleValidate}
            className={validation.isValid ? "border-green-500" : "border-red-500"}
          >
            {validation.isValid ? (
              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
            )}
            Validate
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleGenerate}
            disabled={!validation.isValid}
          >
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
