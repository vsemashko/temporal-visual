import { Activity, GitBranch, Network, Radio, Clock, Play, Square } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const nodeTypes = [
  { type: "start", label: "Start", icon: Play, color: "text-green-600" },
  { type: "activity", label: "Activity", icon: Activity, color: "text-blue-600" },
  { type: "decision", label: "Decision", icon: GitBranch, color: "text-amber-600" },
  { type: "parallel", label: "Parallel", icon: Network, color: "text-purple-600" },
  { type: "signal", label: "Signal", icon: Radio, color: "text-green-600" },
  { type: "timer", label: "Timer", icon: Clock, color: "text-orange-600" },
  { type: "end", label: "End", icon: Square, color: "text-red-600" },
];

export function NodePalette() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <Card className="w-64 h-full">
      <CardHeader>
        <CardTitle className="text-lg">Node Palette</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {nodeTypes.map((node) => {
          const Icon = node.icon;
          return (
            <div
              key={node.type}
              draggable
              onDragStart={(e) => onDragStart(e, node.type)}
              className="flex items-center gap-3 p-3 border rounded-lg cursor-move hover:bg-accent transition-colors"
            >
              <Icon className={`w-5 h-5 ${node.color}`} />
              <span className="text-sm font-medium">{node.label}</span>
            </div>
          );
        })}

        <div className="pt-4 text-xs text-muted-foreground">
          Drag and drop nodes onto the canvas to build your workflow
        </div>
      </CardContent>
    </Card>
  );
}
