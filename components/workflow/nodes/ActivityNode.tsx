import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Activity } from "lucide-react";
import { ActivityNodeData } from "@/lib/types";

export const ActivityNode = memo(({ data, selected }: NodeProps<ActivityNodeData>) => {
  return (
    <div
      className={`px-4 py-3 shadow-md rounded-lg bg-white border-2 min-w-[180px] ${
        selected ? "border-blue-500" : "border-gray-300"
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-blue-600" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-800">{data.label}</div>
          <div className="text-xs text-gray-500">{data.activityName}</div>
        </div>
      </div>

      {data.timeout && (
        <div className="mt-2 text-xs text-gray-600">
          Timeout: {data.timeout}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

ActivityNode.displayName = "ActivityNode";
