import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { ToggleRight } from "lucide-react"

export const ActuatorNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div className="relative bg-white rounded-lg border border-[#D9E4DD] shadow-sm p-3 w-48">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-[#FFA6A6] border-2 border-white"
      />

      <div className="flex items-center">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FFA6A6] flex items-center justify-center mr-2">
          <ToggleRight className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-[#5C6E91]">{data.label}</h3>
          <p className="text-xs text-[#7A8CA3]">{data.properties?.actuatorType || "Switch"} Actuator</p>
        </div>
      </div>

      <div className="mt-2 text-xs text-[#7A8CA3] bg-[#F8F6F0] rounded p-1">
        <div className="flex justify-between">
          <span>State:</span>
          <span>{data.properties?.state || "off"}</span>
        </div>
        <div className="flex justify-between">
          <span>Protocol:</span>
          <span>{data.properties?.protocol || "mqtt"}</span>
        </div>
      </div>
    </div>
  )
})

ActuatorNode.displayName = "ActuatorNode" 