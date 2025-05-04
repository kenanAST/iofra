import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Bell } from "lucide-react"

export const TriggerNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div className="relative bg-white rounded-lg border border-[#D9E4DD] shadow-sm p-3 w-48">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-[#FECDA6] border-2 border-white"
      />

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-[#FECDA6] border-2 border-white"
      />

      <div className="flex items-center">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FECDA6] flex items-center justify-center mr-2">
          <Bell className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-[#5C6E91]">{data.label}</h3>
          <p className="text-xs text-[#7A8CA3]">
            Condition: {data.properties?.condition || ">"} {data.properties?.threshold || 30}
          </p>
        </div>
      </div>

      <div className="mt-2 text-xs text-[#7A8CA3] bg-[#F8F6F0] rounded p-1">
        <div className="flex justify-between">
          <span>Topic:</span>
          <span>{data.properties?.topic || "iot/alerts"}</span>
        </div>
      </div>
    </div>
  )
})

TriggerNode.displayName = "TriggerNode"
