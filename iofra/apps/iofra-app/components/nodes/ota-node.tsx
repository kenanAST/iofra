import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Download } from "lucide-react"

export const OtaNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div className="relative bg-white rounded-lg border border-[#D9E4DD] shadow-sm p-3 w-48">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-[#F3B0C3] border-2 border-white"
      />

      <div className="flex items-center">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#F3B0C3] flex items-center justify-center mr-2">
          <Download className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-[#5C6E91]">{data.label}</h3>
          <p className="text-xs text-[#7A8CA3]">Version: {data.properties?.version || "1.0.0"}</p>
        </div>
      </div>

      <div className="mt-2 text-xs text-[#7A8CA3] bg-[#F8F6F0] rounded p-1">
        <div className="flex justify-between">
          <span>Rollback:</span>
          <span>{data.properties?.rollbackEnabled ? "Enabled" : "Disabled"}</span>
        </div>
        <div className="flex justify-between">
          <span>Delta Updates:</span>
          <span>{data.properties?.deltaUpdates ? "Enabled" : "Disabled"}</span>
        </div>
      </div>
    </div>
  )
})

OtaNode.displayName = "OtaNode"
