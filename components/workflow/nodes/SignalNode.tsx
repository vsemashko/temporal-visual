import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Radio } from "lucide-react";
import { SignalNodeData } from "@/lib/types";

export const SignalNode = memo(({ data, selected }: NodeProps<SignalNodeData>) => {
  return (
    <div
      className={`px-4 py-3 shadow-md rounded-lg bg-green-50 border-2 min-w-[180px] ${
        selected ? "border-green-500" : "border-green-300"
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex items-center gap-2">
        <Radio className="w-5 h-5 text-green-600" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-800">{data.label}</div>
          <div className="text-xs text-gray-500">{data.signalName}</div>
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

SignalNode.displayName = "SignalNode";
