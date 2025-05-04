import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Thermometer } from "lucide-react"

export const SensorNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div className="relative bg-white rounded-lg border border-[#D9E4DD] shadow-sm p-3 w-48">
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-[#A6D1E6] border-2 border-white"
      />

      <div className="flex items-center">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#A6D1E6] flex items-center justify-center mr-2">
          <Thermometer className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-[#5C6E91]">{data.label}</h3>
          <p className="text-xs text-[#7A8CA3]">{data.properties?.sensorType || "Temperature"} Sensor</p>
        </div>
      </div>

      <div className="mt-2 text-xs text-[#7A8CA3] bg-[#F8F6F0] rounded p-1">
        <div className="flex justify-between">
          <span>Interval:</span>
          <span>{data.properties?.interval || 5}s</span>
        </div>
        <div className="flex justify-between">
          <span>Unit:</span>
          <span>{data.properties?.unit || "celsius"}</span>
        </div>
      </div>
    </div>
  )
})

SensorNode.displayName = "SensorNode"
