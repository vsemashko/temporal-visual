import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Square } from "lucide-react";

export const EndNode = memo(({ data, selected }: NodeProps<{ label: string }>) => {
  return (
    <div
      className={`px-4 py-3 shadow-md rounded-full bg-red-500 border-2 min-w-[120px] text-white ${
        selected ? "border-red-700" : "border-red-600"
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex items-center justify-center gap-2">
        <Square className="w-4 h-4" />
        <div className="text-sm font-semibold">{data.label}</div>
      </div>
    </div>
  );
});

EndNode.displayName = "EndNode";
