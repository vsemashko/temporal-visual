import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Network } from "lucide-react";
import { ParallelNodeData } from "@/lib/types";

export const ParallelNode = memo(({ data, selected }: NodeProps<ParallelNodeData>) => {
  return (
    <div
      className={`px-4 py-3 shadow-md rounded-lg bg-purple-50 border-2 min-w-[180px] ${
        selected ? "border-purple-500" : "border-purple-300"
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex items-center gap-2">
        <Network className="w-5 h-5 text-purple-600" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-800">{data.label}</div>
          <div className="text-xs text-gray-500">
            {data.branches} parallel branches
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

ParallelNode.displayName = "ParallelNode";
