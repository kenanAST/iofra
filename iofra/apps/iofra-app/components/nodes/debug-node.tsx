import { memo, useState, useEffect } from "react"
import { Handle, Position, type NodeProps, useReactFlow } from "reactflow"
import { Search, ArrowRight, CornerRightDown, Thermometer, ArrowUpRight, Droplets, AlertTriangle } from "lucide-react"
import wsClient from "@/lib/websocket-client"

interface DebugData {
  timestamp: string;
  source: string;
  sourceName: string;
  target: string;
  targetName: string;
  sensorType?: string;
  value?: any;
  data: any;
  conditionMet?: boolean;
  triggerInfo?: {
    condition: string;
    threshold: number;
  };
}

// Helper function to evaluate trigger conditions
const evaluateTriggerCondition = (value: number, condition: string, threshold: number): boolean => {
  switch (condition) {
    case '>':
      return value > threshold;
    case '<':
      return value < threshold;
    case '==':
      return value === threshold;
    case '>=':
      return value >= threshold;
    case '<=':
      return value <= threshold;
    case '!=':
      return value !== threshold;
    default:
      return false;
  }
};

export const DebugNode = memo(({ data, isConnectable, id }: NodeProps) => {
  const [debugData, setDebugData] = useState<DebugData[]>([]);
  const [expanded, setExpanded] = useState<boolean>(true);
  const [connectedSensors, setConnectedSensors] = useState<{
    id: string, 
    deviceId: string, 
    type: string,
    triggerNode?: {
      id: string,
      condition: string,
      threshold: number
    }
  }[]>([]);
  
  const reactFlowInstance = useReactFlow();
  
  // Identify which specific sensor handles are connected to this debug node
  useEffect(() => {
    if (!id) return;
    
    const updateConnectedSensors = () => {
      const edges = reactFlowInstance.getEdges();
      const nodes = reactFlowInstance.getNodes();
      
      // Store connected sensors with more information
      const sensorConnections: {
        id: string, 
        deviceId: string, 
        type: string,
        triggerNode?: {
          id: string,
          condition: string,
          threshold: number
        }
      }[] = [];
      
      // CASE 1: Direct connections from specific sensor handles
      edges.filter(edge => edge.target === id && edge.sourceHandle?.startsWith('sensor-')).forEach(edge => {
        const sensorId = edge.sourceHandle!.replace('sensor-', '');
        const sourceNode = nodes.find(node => node.id === edge.source);
        
        if (sourceNode?.type === 'device') {
          const sensor = sourceNode.data.properties?.sensors?.find((s: any) => s.id === sensorId);
          if (sensor) {
            sensorConnections.push({
              id: sensorId, 
              deviceId: sourceNode.id, 
              type: sensor.sensorType
            });
          }
        }
      });
      
      // CASE 2: Connections through a trigger node
      // First find all nodes connected to this debug node
      const connectedNodeIds = edges
        .filter(edge => edge.target === id || edge.source === id)
        .map(edge => edge.target === id ? edge.source : edge.target);
      
      // Find all trigger nodes in this set
      const connectedTriggers = nodes.filter(node => 
        node.type === 'trigger' && connectedNodeIds.includes(node.id)
      );
      
      // For each trigger, check if it's connected to a device
      connectedTriggers.forEach(triggerNode => {
        const triggerSourceDevice = triggerNode.data.properties?.sourceDevice;
        const triggerSourceSensor = triggerNode.data.properties?.sourceSensor;
        const condition = triggerNode.data.properties?.condition || '>';
        const threshold = triggerNode.data.properties?.threshold || 0;
        
        if (triggerSourceDevice && triggerSourceSensor) {
          const deviceNode = nodes.find(node => node.id === triggerSourceDevice);
          if (deviceNode?.type === 'device') {
            const sensor = deviceNode.data.properties?.sensors?.find(
              (s: any) => s.id === triggerSourceSensor
            );
            
            if (sensor) {
              sensorConnections.push({
                id: triggerSourceSensor,
                deviceId: triggerSourceDevice,
                type: sensor.sensorType,
                triggerNode: {
                  id: triggerNode.id,
                  condition: condition,
                  threshold: threshold
                }
              });
            }
          }
        }
      });
      
      // CASE 3: General connections to device nodes (without triggers)
      // If the debug node is directly connected to a device node, consider all its sensors connected
      edges.filter(edge => 
        (edge.target === id && !edge.sourceHandle) || 
        (edge.source === id && !edge.targetHandle)
      ).forEach(edge => {
        const deviceId = edge.target === id ? edge.source : edge.target;
        const deviceNode = nodes.find(node => node.id === deviceId);
        
        // Only add direct device connections if they're not going through a trigger
        const isConnectedViaTrigger = connectedTriggers.some(trigger => 
          trigger.data.properties?.sourceDevice === deviceId
        );
        
        if (!isConnectedViaTrigger && deviceNode?.type === 'device' && deviceNode.data.properties?.sensors) {
          // Add all sensors from this device
          deviceNode.data.properties.sensors.forEach((sensor: any) => {
            // Check if this sensor is already in the list
            const alreadyExists = sensorConnections.some(conn => 
              conn.id === sensor.id && conn.deviceId === deviceNode.id
            );
            
            if (!alreadyExists) {
              sensorConnections.push({
                id: sensor.id,
                deviceId: deviceNode.id,
                type: sensor.sensorType
              });
            }
          });
        }
      });
      
      setConnectedSensors(sensorConnections);
    };
    
    // Initial update
    updateConnectedSensors();
    
    // Set a periodic checker
    const checkInterval = setInterval(() => {
      updateConnectedSensors();
    }, 2000);
    
    return () => {
      clearInterval(checkInterval);
    };
  }, [id, reactFlowInstance]);
  
  // Subscribe to flow data events
  useEffect(() => {
    if (!id) return;
    
    const handleFlowData = (flowData: any) => {
      // Only add data if there's an actual value to display
      if (flowData.value !== undefined && flowData.sensorId) {
        // Find the corresponding connected sensor
        const connectedSensor = connectedSensors.find(
          sensor => sensor.id === flowData.sensorId && 
                   sensor.deviceId === flowData.source
        );
        
        if (connectedSensor) {
          // Check if this sensor has a trigger attached
          let conditionMet = true; // Default for sensors without triggers
          
          if (connectedSensor.triggerNode) {
            // Only allow data to flow if trigger condition is met
            conditionMet = evaluateTriggerCondition(
              flowData.value, 
              connectedSensor.triggerNode.condition, 
              connectedSensor.triggerNode.threshold
            );
            
            // If condition is not met and we're after a trigger, don't show the data
            if (!conditionMet) {
              return;
            }
          }
          
          const newData = {
            timestamp: new Date().toLocaleTimeString(),
            source: flowData.source || 'unknown',
            sourceName: flowData.sourceName || 'unknown',
            target: flowData.target || 'unknown',
            targetName: flowData.targetName || 'unknown',
            sensorType: flowData.sensorType,
            value: flowData.value,
            data: flowData.data || {},
            conditionMet,
            triggerInfo: connectedSensor.triggerNode ? {
              condition: connectedSensor.triggerNode.condition,
              threshold: connectedSensor.triggerNode.threshold
            } : undefined
          };
          
          setDebugData(prev => {
            const maxEntries = data.properties?.maxEntries || 5;
            const updatedData = [newData, ...prev].slice(0, maxEntries);
            return updatedData;
          });
        }
      }
    };
    
    // Check for real data from all connected sensors
    const checkRealData = () => {
      if (connectedSensors.length === 0) return;
      
      const nodes = reactFlowInstance.getNodes();
      
      // For each connected sensor
      connectedSensors.forEach(sensor => {
        const deviceNode = nodes.find(n => n.id === sensor.deviceId);
        
        if (deviceNode?.type === 'device' && deviceNode.data.properties?.sensors) {
          // Find the sensor data
          const sensorData = deviceNode.data.properties.sensors.find(
            (s: any) => s.id === sensor.id
          );
          
          if (sensorData && sensorData.value !== undefined) {
            // If there's a trigger node, only send data if condition is met
            let sendData = true;
            
            if (sensor.triggerNode) {
              sendData = evaluateTriggerCondition(
                sensorData.value, 
                sensor.triggerNode.condition, 
                sensor.triggerNode.threshold
              );
            }
            
            if (sendData) {
              // Create flow data with actual sensor data
              handleFlowData({
                path: [id],
                source: deviceNode.id,
                sourceName: deviceNode.data.label,
                target: id,
                targetName: data.label || "Debug",
                sensorType: sensor.type,
                sensorId: sensor.id,
                value: sensorData.value,
                data: { 
                  [sensor.type]: sensorData.value,
                  unit: sensor.type === 'temperature' ? "°C" : 
                        sensor.type === 'humidity' ? "%" : "",
                  timestamp: new Date().toISOString()
                }
              });
            }
          }
        }
      });
    };
    
    // Check for real data periodically
    const interval = setInterval(() => {
      checkRealData();
    }, 2000);
    
    // Listen for real-time updates via WebSocket
    const handleTelemetryUpdate = (telemetryData: any) => {
      if (!telemetryData.deviceId || !telemetryData.data) return;
      
      // Check if we have any sensors from this device
      const deviceSensors = connectedSensors.filter(
        sensor => sensor.deviceId === telemetryData.deviceId
      );
      
      if (deviceSensors.length > 0) {
        const nodes = reactFlowInstance.getNodes();
        const deviceNode = nodes.find(node => node.id === telemetryData.deviceId);
        
        if (deviceNode) {
          // Process each sensor we're connected to
          deviceSensors.forEach(sensor => {
            if (telemetryData.data[sensor.type] !== undefined) {
              // If there's a trigger node, check if condition is met
              let sendData = true;
              
              if (sensor.triggerNode) {
                sendData = evaluateTriggerCondition(
                  telemetryData.data[sensor.type], 
                  sensor.triggerNode.condition, 
                  sensor.triggerNode.threshold
                );
              }
              
              if (sendData) {
                handleFlowData({
                  path: [id],
                  source: deviceNode.id,
                  sourceName: deviceNode.data.label,
                  target: id,
                  targetName: data.label || "Debug",
                  sensorType: sensor.type,
                  sensorId: sensor.id,
                  value: telemetryData.data[sensor.type],
                  data: { [sensor.type]: telemetryData.data[sensor.type] }
                });
              }
            }
          });
        }
      }
    };
    
    // Subscribe to websocket events for real-time data
    wsClient.on('device_telemetry', handleTelemetryUpdate);
    
    return () => {
      clearInterval(interval);
      wsClient.off('device_telemetry', handleTelemetryUpdate);
    };
  }, [id, reactFlowInstance, data, connectedSensors]);
  
  // Get proper icon for sensor type
  const getSensorIcon = (sensorType?: string) => {
    if (!sensorType) return <ArrowRight className="h-3 w-3 text-[#86C5D8]" />;
    
    switch (sensorType.toLowerCase()) {
      case 'temperature':
        return <Thermometer className="h-3 w-3 text-red-500" />;
      case 'humidity':
        return <Droplets className="h-3 w-3 text-blue-500" />;
      default:
        return <ArrowUpRight className="h-3 w-3 text-[#86C5D8]" />;
    }
  };
  
  // Format value based on sensor type
  const formatValue = (value: any, sensorType?: string) => {
    if (value === undefined || value === null) return "N/A";
    
    switch (sensorType?.toLowerCase()) {
      case 'temperature':
        return `${Number(value).toFixed(1)}°C`;
      case 'humidity':
        return `${Number(value).toFixed(1)}%`;
      case 'pressure':
        return `${Number(value).toFixed(1)} hPa`;
      case 'light':
        return `${Number(value).toFixed(0)} lux`;
      default:
        return typeof value === 'number' ? value.toFixed(1) : String(value);
    }
  };
  
  // Count number of triggers vs direct connections
  const triggerCount = connectedSensors.filter(s => s.triggerNode).length;
  const directCount = connectedSensors.length - triggerCount;
  
  return (
    <div className={`relative bg-white rounded-lg border border-[#D9E4DD] shadow-sm p-3 ${expanded ? 'w-64' : 'w-48'}`}>
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-[#86C5D8] border-2 border-white"
      />

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-[#86C5D8] border-2 border-white"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#86C5D8] flex items-center justify-center mr-2">
            <Search className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#5C6E91]">{data.label || "Debug"}</h3>
            <p className="text-xs text-[#7A8CA3]">Flow Inspector</p>
          </div>
        </div>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-[#5C6E91] hover:text-[#3A506B] transition-colors p-1"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      <div className="mt-2 text-xs text-[#7A8CA3] bg-[#F8F6F0] rounded p-1">
        <div className="flex justify-between">
          <span>Status:</span>
          <span className="text-green-500">Active</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Connections:</span>
          <span>
            {triggerCount > 0 && (
              <span className="inline-flex items-center mr-1">
                <AlertTriangle className="h-3 w-3 text-[#FECDA6] mr-1" />
                {triggerCount}
              </span>
            )}
            {directCount > 0 && (
              <span className="inline-flex items-center">
                <ArrowRight className="h-3 w-3 text-[#86C5D8] mr-1" />
                {directCount}
              </span>
            )}
          </span>
        </div>
      </div>
      
      {expanded && (
        <div className="mt-3 border-t border-[#D9E4DD] pt-2">
          <h4 className="text-xs font-medium text-[#5C6E91] mb-1">
            {debugData.length > 0 ? 
              "Data Flow" + (triggerCount > 0 ? " (Trigger Conditions Met)" : "") : 
              "Waiting for Data:"}
          </h4>
          {debugData.length > 0 ? (
            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
              {debugData.map((item, index) => (
                <div key={index} className="bg-[#F8F6F0] p-1.5 rounded text-[10px] text-[#5C6E91]">
                  <div className="flex items-center gap-1 mb-1">
                    {getSensorIcon(item.sensorType)}
                    <span className="font-medium">{item.timestamp}</span>
                    {item.value !== undefined && (
                      <span className={`ml-auto font-bold ${
                        item.triggerInfo ? 'text-[#FECDA6]' : ''
                      }`}>
                        {formatValue(item.value, item.sensorType)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className="bg-[#E2F0F7] px-1 py-0.5 rounded truncate max-w-[96px]" title={item.sourceName}>
                      {item.sourceName}
                    </span>
                    <CornerRightDown className="h-3 w-3 mx-1 text-[#86C5D8]" />
                    <span className="bg-[#E2F0F7] px-1 py-0.5 rounded truncate max-w-[96px]" title={item.targetName}>
                      {item.targetName}
                    </span>
                  </div>
                  
                  {item.triggerInfo && (
                    <div className="mt-1 flex items-center">
                      <AlertTriangle className="h-3 w-3 text-[#FECDA6] mr-1" />
                      <span className="text-[#FECDA6] text-[9px]">
                        Trigger: {formatValue(item.value, item.sensorType)} {item.triggerInfo.condition} {item.triggerInfo.threshold}
                      </span>
                    </div>
                  )}
                  
                  {data.properties?.capturePayload !== false && (
                    <div className="mt-1 font-mono bg-[#E2F0F7] p-1 rounded overflow-x-auto whitespace-nowrap text-[8px]">
                      {JSON.stringify(item.data)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-16 text-[#7A8CA3] text-xs">
              {connectedSensors.length > 0 ? (
                triggerCount > 0 ? (
                  <>
                    <p>Waiting for trigger conditions to be met</p>
                    <p className="text-[9px] mt-1">Data will flow when conditions are satisfied</p>
                  </>
                ) : (
                  <p>Waiting for data from connected sensors...</p>
                )
              ) : (
                <>
                  <p>Connect to sensors or triggers</p>
                  <p className="text-[9px] mt-1">Sensors will be automatically detected</p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
});

DebugNode.displayName = "DebugNode" 