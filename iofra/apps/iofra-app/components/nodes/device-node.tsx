import { memo, useEffect, useState } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { HardDrive, Thermometer, ToggleRight, Hash } from "lucide-react"
import { SensorTelemetry } from "../sensor-telemetry"
import wsClient from "@/lib/websocket-client"
import { useDevices } from "@/hooks/useDevices"

// Define types for the node data
interface DeviceNodeData {
  label: string
  properties: {
    status?: string
    ipAddress?: string
    location?: string
    sensors?: Array<{
      id: string
      name: string
      sensorType: string
      value?: any
      timestamp?: string | Date
    }>
    actuators?: Array<{
      id: string
      name: string
      actuatorType: string
    }>
  }
}

export const DeviceNode = memo(({ data, id, isConnectable }: NodeProps) => {
  const sensorCount = data.properties?.sensors?.length || 0
  const actuatorCount = data.properties?.actuators?.length || 0
  const [nodeData, setNodeData] = useState<DeviceNodeData>(data as DeviceNodeData)
  const { devices, updateCounter } = useDevices()
  const [updateTrigger, setUpdateTrigger] = useState(0)

  // Find the device from the devices array
  const device = devices.find(d => d.deviceId === id || d.deviceId === nodeData.label)
  
  // Update local state when data prop changes
  useEffect(() => {
    setNodeData(data as DeviceNodeData)
  }, [data])
  
  // Force a re-render when the useDevices hook updates
  useEffect(() => {
    if (device) {
      setNodeData(prev => ({
        ...prev,
        properties: {
          ...prev.properties,
          status: device.status
        }
      }))
      setUpdateTrigger(prev => prev + 1) // Force UI update
    }
  }, [device?.status, updateCounter]) // Add updateCounter to dependencies

  // Listen for direct WebSocket updates
  useEffect(() => {
    if (!id) return

    // Handle device status updates
    const handleStatusUpdate = (updateData: any) => {
      if (updateData.deviceId === id) {
        setNodeData((prev: DeviceNodeData) => ({
          ...prev,
          properties: {
            ...prev.properties,
            status: updateData.status
          }
        }))
        // Force a re-render when status changes
        setUpdateTrigger(prev => prev + 1)
      }
    }

    // Handle device telemetry updates
    const handleTelemetryUpdate = (telemetryData: any) => {
      if (telemetryData.deviceId === id) {
        setNodeData((prev: DeviceNodeData) => {
          // Don't update telemetry if device is offline
          if (prev.properties?.status === "offline") {
            return prev;
          }
          
          const updatedSensors = prev.properties?.sensors?.map((sensor) => {
            // Update sensor values if the telemetry includes data for this sensor
            if (telemetryData.data[sensor.sensorType]) {
              return {
                ...sensor,
                value: telemetryData.data[sensor.sensorType],
                timestamp: telemetryData.timestamp
              }
            }
            return sensor
          })

          return {
            ...prev,
            properties: {
              ...prev.properties,
              sensors: updatedSensors
            }
          }
        })
        setUpdateTrigger(prev => prev + 1) // Force UI update for telemetry changes too
      }
    }

    // Subscribe to WebSocket events
    wsClient.on('device_status_update', handleStatusUpdate)
    wsClient.on('device_telemetry', handleTelemetryUpdate)

    // Clean up when component unmounts
    return () => {
      wsClient.off('device_status_update', handleStatusUpdate)
      wsClient.off('device_telemetry', handleTelemetryUpdate)
    }
  }, [id, updateTrigger, updateCounter]) // Add updateCounter to dependencies

  // Use the most accurate status: from device hook if available, otherwise from nodeData
  const displayStatus = device?.status || nodeData.properties?.status || "unknown";

  return (
    <div className="relative bg-white rounded-lg border border-[#D9E4DD] shadow-sm p-3 w-64">
      {/* Main device handles */}
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
          <h3 className="text-sm font-medium text-[#5C6E91]">{nodeData.label}</h3>
          <p className="text-xs text-[#7A8CA3]">{id || 'No Device ID'}</p>
        </div>
      </div>

      <div className="mt-2 text-xs text-[#7A8CA3] bg-[#F8F6F0] rounded p-1 space-y-1">
        <div className="flex justify-between">
          <span>Status:</span>
          <span className={displayStatus === "online" ? "text-green-500" : "text-red-500"}>
            {displayStatus} 
          </span>
        </div>
      </div>

      {(sensorCount > 0 || actuatorCount > 0) && (
        <div className="mt-2 text-xs border-t border-[#D9E4DD] pt-2">
          <div className="font-medium text-[#5C6E91] mb-1">Components:</div>
          
          {nodeData.properties?.sensors?.map((sensor, index) => (
            <div key={`sensor-${sensor.id}-${updateTrigger}`} className="mb-2 relative">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-[#A6D1E6] flex items-center justify-center mr-1">
                  <Thermometer className="h-2 w-2 text-white" />
                </div>
                <span className="text-[#7A8CA3]">{sensor.name} ({sensor.sensorType})</span>
                
                {/* Individual sensor handle */}
                <Handle
                  id={`sensor-${sensor.id}`}
                  type="source"
                  position={Position.Right}
                  isConnectable={isConnectable}
                  className="w-2.5 h-2.5 bg-[#A6D1E6] border-2 border-white"
                  style={{ right: -8, top: '50%' }}
                />
              </div>
              {id && (
                <SensorTelemetry 
                  deviceId={id} 
                  sensorId={sensor.id} 
                  sensorType={sensor.sensorType}
                  value={sensor.value}
                  timestamp={sensor.timestamp} 
                />
              )}
            </div>
          ))}
          
          {nodeData.properties?.actuators?.map((actuator, index) => (
            <div key={`actuator-${actuator.id}-${updateTrigger}`} className="flex items-center mb-1 relative">
              <div className="w-4 h-4 rounded-full bg-[#FFA6A6] flex items-center justify-center mr-1">
                <ToggleRight className="h-2 w-2 text-white" />
              </div>
              <span className="text-[#7A8CA3]">{actuator.name} ({actuator.actuatorType})</span>
              
              {/* Individual actuator handle */}
              <Handle
                id={`actuator-${actuator.id}`}
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                className="w-2.5 h-2.5 bg-[#FFA6A6] border-2 border-white"
                style={{ right: -8, top: '50%' }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

DeviceNode.displayName = "DeviceNode" 