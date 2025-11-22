import { WorkflowNode, ActivityNodeData, DecisionNodeData, SignalNodeData, TimerNodeData } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useWorkflowStore } from "@/lib/store";

interface PropertyPanelProps {
  selectedNode: WorkflowNode | null;
}

export function PropertyPanel({ selectedNode }: PropertyPanelProps) {
  const updateNode = useWorkflowStore((state) => state.updateNode);

  if (!selectedNode) {
    return (
      <Card className="w-80 h-full">
        <CardHeader>
          <CardTitle className="text-lg">Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select a node to edit its properties
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleChange = (field: string, value: any) => {
    updateNode(selectedNode.id, {
      ...selectedNode.data,
      [field]: value,
    });
  };

  const renderActivityProperties = (data: ActivityNodeData) => (
    <div className="space-y-4">
      <div>
        <Label>Label</Label>
        <Input
          value={data.label}
          onChange={(e) => handleChange("label", e.target.value)}
          placeholder="Node label"
        />
      </div>
      <div>
        <Label>Activity Name</Label>
        <Input
          value={data.activityName}
          onChange={(e) => handleChange("activityName", e.target.value)}
          placeholder="e.g., processPayment"
        />
      </div>
      <div>
        <Label>Timeout</Label>
        <Input
          value={data.timeout || ""}
          onChange={(e) => handleChange("timeout", e.target.value)}
          placeholder="e.g., 5m, 30s"
        />
      </div>
      <div>
        <Label>Max Retry Attempts</Label>
        <Input
          type="number"
          value={data.retryPolicy?.maxAttempts || 3}
          onChange={(e) =>
            handleChange("retryPolicy", {
              ...data.retryPolicy,
              maxAttempts: parseInt(e.target.value),
            })
          }
        />
      </div>
    </div>
  );

  const renderDecisionProperties = (data: DecisionNodeData) => (
    <div className="space-y-4">
      <div>
        <Label>Label</Label>
        <Input
          value={data.label}
          onChange={(e) => handleChange("label", e.target.value)}
          placeholder="Node label"
        />
      </div>
      <div>
        <Label>Condition</Label>
        <Input
          value={data.condition}
          onChange={(e) => handleChange("condition", e.target.value)}
          placeholder="e.g., result.success"
        />
      </div>
    </div>
  );

  const renderSignalProperties = (data: SignalNodeData) => (
    <div className="space-y-4">
      <div>
        <Label>Label</Label>
        <Input
          value={data.label}
          onChange={(e) => handleChange("label", e.target.value)}
          placeholder="Node label"
        />
      </div>
      <div>
        <Label>Signal Name</Label>
        <Input
          value={data.signalName}
          onChange={(e) => handleChange("signalName", e.target.value)}
          placeholder="e.g., approvalSignal"
        />
      </div>
      <div>
        <Label>Timeout (optional)</Label>
        <Input
          value={data.timeout || ""}
          onChange={(e) => handleChange("timeout", e.target.value)}
          placeholder="e.g., 1h, 30m"
        />
      </div>
    </div>
  );

  const renderTimerProperties = (data: TimerNodeData) => (
    <div className="space-y-4">
      <div>
        <Label>Label</Label>
        <Input
          value={data.label}
          onChange={(e) => handleChange("label", e.target.value)}
          placeholder="Node label"
        />
      </div>
      <div>
        <Label>Duration</Label>
        <Input
          value={data.duration}
          onChange={(e) => handleChange("duration", e.target.value)}
          placeholder="e.g., 10s, 5m, 1h"
        />
      </div>
    </div>
  );

  const renderProperties = () => {
    switch (selectedNode.type) {
      case "activity":
        return renderActivityProperties(selectedNode.data as ActivityNodeData);
      case "decision":
        return renderDecisionProperties(selectedNode.data as DecisionNodeData);
      case "signal":
        return renderSignalProperties(selectedNode.data as SignalNodeData);
      case "timer":
        return renderTimerProperties(selectedNode.data as TimerNodeData);
      default:
        return (
          <div>
            <Label>Label</Label>
            <Input
              value={selectedNode.data.label}
              onChange={(e) => handleChange("label", e.target.value)}
              placeholder="Node label"
            />
          </div>
        );
    }
  };

  return (
    <Card className="w-80 h-full overflow-auto">
      <CardHeader>
        <CardTitle className="text-lg">Properties</CardTitle>
        <p className="text-sm text-muted-foreground">
          {selectedNode.type.charAt(0).toUpperCase() + selectedNode.type.slice(1)} Node
        </p>
      </CardHeader>
      <CardContent>{renderProperties()}</CardContent>
    </Card>
  );
}
