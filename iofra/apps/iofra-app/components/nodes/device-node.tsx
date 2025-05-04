import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { HardDrive } from "lucide-react"

export const DeviceNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div className="relative bg-white rounded-lg border border-[#D9E4DD] shadow-sm p-3 w-48">
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-[#C3E8BD] border-2 border-white"
      />
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-[#C3E8BD] border-2 border-white"
      />

      <div className="flex items-center">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#C3E8BD] flex items-center justify-center mr-2">
          <HardDrive className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-[#5C6E91]">{data.label}</h3>
          <p className="text-xs text-[#7A8CA3]">Device</p>
        </div>
      </div>

      <div className="mt-2 text-xs text-[#7A8CA3] bg-[#F8F6F0] rounded p-1">
        <div className="flex justify-between">
          <span>Status:</span>
          <span>{data.properties?.status || "online"}</span>
        </div>
        <div className="flex justify-between">
          <span>IP Address:</span>
          <span>{data.properties?.ipAddress || "192.168.1.1"}</span>
        </div>
        <div className="flex justify-between">
          <span>Components:</span>
          <span>{data.properties?.components?.length || 0}</span>
        </div>
      </div>
    </div>
  )
})

DeviceNode.displayName = "DeviceNode" 