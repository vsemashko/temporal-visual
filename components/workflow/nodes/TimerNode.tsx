import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Clock } from "lucide-react";
import { TimerNodeData } from "@/lib/types";

export const TimerNode = memo(({ data, selected }: NodeProps<TimerNodeData>) => {
  return (
    <div
      className={`px-4 py-3 shadow-md rounded-lg bg-orange-50 border-2 min-w-[180px] ${
        selected ? "border-orange-500" : "border-orange-300"
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-orange-600" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-800">{data.label}</div>
          <div className="text-xs text-gray-500">Sleep: {data.duration}</div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

TimerNode.displayName = "TimerNode";
