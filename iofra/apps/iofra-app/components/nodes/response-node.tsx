import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { MessageSquare } from "lucide-react"

export const ResponseNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div className="relative bg-white rounded-lg border border-[#D9E4DD] shadow-sm p-3 w-48">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-[#CBAACB] border-2 border-white"
      />

      <div className="flex items-center">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#CBAACB] flex items-center justify-center mr-2">
          <MessageSquare className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-[#5C6E91]">{data.label}</h3>
          <p className="text-xs text-[#7A8CA3]">{data.properties?.action || "Notification"}</p>
        </div>
      </div>

      <div className="mt-2 text-xs text-[#7A8CA3] bg-[#F8F6F0] rounded p-1">
        <div className="flex justify-between">
          <span>Recipient:</span>
          <span>{data.properties?.recipient || "admin"}</span>
        </div>
        <div className="flex justify-between">
          <span>Message:</span>
          <span className="truncate max-w-[100px]">{data.properties?.message || "Alert triggered"}</span>
        </div>
      </div>
    </div>
  )
})

ResponseNode.displayName = "ResponseNode"
