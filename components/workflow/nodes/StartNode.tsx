import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Play } from "lucide-react";

export const StartNode = memo(({ data, selected }: NodeProps<{ label: string }>) => {
  return (
    <div
      className={`px-4 py-3 shadow-md rounded-full bg-green-500 border-2 min-w-[120px] text-white ${
        selected ? "border-green-700" : "border-green-600"
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        <Play className="w-4 h-4" />
        <div className="text-sm font-semibold">{data.label}</div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

StartNode.displayName = "StartNode";
