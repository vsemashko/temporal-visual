import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { GitBranch } from "lucide-react";
import { DecisionNodeData } from "@/lib/types";

export const DecisionNode = memo(({ data, selected }: NodeProps<DecisionNodeData>) => {
  return (
    <div
      className={`px-4 py-3 shadow-md rounded-lg bg-amber-50 border-2 min-w-[180px] ${
        selected ? "border-amber-500" : "border-amber-300"
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex items-center gap-2">
        <GitBranch className="w-5 h-5 text-amber-600" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-800">{data.label}</div>
          <div className="text-xs text-gray-500 truncate">{data.condition}</div>
        </div>
      </div>

      <div className="flex justify-between mt-2">
        <Handle
          type="source"
          position={Position.Bottom}
          id="true"
          className="w-3 h-3"
          style={{ left: "30%" }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="false"
          className="w-3 h-3"
          style={{ left: "70%" }}
        />
      </div>
    </div>
  );
});

DecisionNode.displayName = "DecisionNode";
