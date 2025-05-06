import { memo, useEffect } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { HardDrive, Thermometer, ToggleRight, Hash } from "lucide-react"
import { SensorTelemetry } from "../sensor-telemetry"

export const DeviceNode = memo(({ data, id, isConnectable }: NodeProps) => {
  const sensorCount = data.properties?.sensors?.length || 0
  const actuatorCount = data.properties?.actuators?.length || 0

  useEffect(() => {
    console.log('MeowCount', data)
  }, [data])

  return (
    <div className="relative bg-white rounded-lg border border-[#D9E4DD] shadow-sm p-3 w-64">
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
          <p className="text-xs text-[#7A8CA3]">{id || 'No Device ID'}</p>
        </div>
      </div>

      <div className="mt-2 text-xs text-[#7A8CA3] bg-[#F8F6F0] rounded p-1 space-y-1">
        <div className="flex justify-between">
          <span>Status:</span>
          <span className={data.properties?.status === "online" ? "text-green-500" : "text-red-500"}>
            {data.properties?.status || "online"}
          </span>
        </div>
      </div>

      {(sensorCount > 0 || actuatorCount > 0) && (
        <div className="mt-2 text-xs border-t border-[#D9E4DD] pt-2">
          <div className="font-medium text-[#5C6E91] mb-1">Components:</div>
          
          {data.properties?.sensors?.map((sensor: any, index: number) => (
            <div key={`sensor-${index}`} className="mb-2">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-[#A6D1E6] flex items-center justify-center mr-1">
                  <Thermometer className="h-2 w-2 text-white" />
                </div>
                <span className="text-[#7A8CA3]">{sensor.name} ({sensor.sensorType})</span>
              </div>
              {id && (
                <SensorTelemetry 
                  deviceId={id} 
                  sensorId={sensor.id} 
                  sensorType={sensor.sensorType} 
                />
              )}
            </div>
          ))}
          
          {data.properties?.actuators?.map((actuator: any, index: number) => (
            <div key={`actuator-${index}`} className="flex items-center mb-1">
              <div className="w-4 h-4 rounded-full bg-[#FFA6A6] flex items-center justify-center mr-1">
                <ToggleRight className="h-2 w-2 text-white" />
              </div>
              <span className="text-[#7A8CA3]">{actuator.name} ({actuator.actuatorType})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

DeviceNode.displayName = "DeviceNode" 