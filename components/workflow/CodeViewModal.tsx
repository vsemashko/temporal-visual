"use client";

import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Copy } from "lucide-react";
import { useWorkflowStore } from "@/lib/store";
import { generateWorkflowCode } from "@/lib/codegen";

interface CodeViewModalProps {
  open: boolean;
  onClose: () => void;
}

export function CodeViewModal({ open, onClose }: CodeViewModalProps) {
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const [code, setCode] = useState("");
  const [activeTab, setActiveTab] = useState<"workflow" | "activities">("workflow");

  useEffect(() => {
    if (open) {
      const generated = generateWorkflowCode(nodes, edges);
      setCode(activeTab === "workflow" ? generated.workflowCode : generated.activityCode);
    }
  }, [open, nodes, edges, activeTab]);

  if (!open) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    alert("Code copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-[90vw] h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Generated Code</h2>
            <div className="flex gap-2">
              <Button
                variant={activeTab === "workflow" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("workflow")}
              >
                Workflow
              </Button>
              <Button
                variant={activeTab === "activities" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("activities")}
              >
                Activities
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1">
          <Editor
            height="100%"
            defaultLanguage="typescript"
            value={code}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: true },
              fontSize: 14,
            }}
          />
        </div>
      </Card>
    </div>
  );
}
