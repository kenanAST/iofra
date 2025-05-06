import { memo, useState, useEffect } from "react"
import { Handle, Position, type NodeProps, useReactFlow } from "reactflow"
import { Search, ArrowRight, CornerRightDown, Thermometer, ArrowUpRight, Droplets } from "lucide-react"
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
}

export const DebugNode = memo(({ data, isConnectable, id }: NodeProps) => {
  const [debugData, setDebugData] = useState<DebugData[]>([]);
  const [expanded, setExpanded] = useState<boolean>(true);
  const [connectedSensors, setConnectedSensors] = useState<string[]>([]);
  const reactFlowInstance = useReactFlow();
  
  // Identify which specific sensor handles are connected to this debug node
  useEffect(() => {
    if (!id) return;
    
    const updateConnectedSensors = () => {
      const edges = reactFlowInstance.getEdges();
      const nodes = reactFlowInstance.getNodes();
      
      // Find edges connected to this debug node
      const relevantEdges = edges.filter(edge => 
        edge.source === id || edge.target === id
      );
      
      // Extract connected sensor IDs from source handles
      const sensorIds: string[] = [];
      
      relevantEdges.forEach(edge => {
        // For edges where device is the source and has a source handle (specific sensor)
        if (edge.sourceHandle && edge.sourceHandle.startsWith('sensor-')) {
          const sensorId = edge.sourceHandle.replace('sensor-', '');
          sensorIds.push(sensorId);
        }
        
        // For edges where this debug node is the source, check what's on the other side
        if (edge.source === id) {
          const targetNode = nodes.find(node => node.id === edge.target);
          // If connected to a trigger node with a specific sensor configured
          if (targetNode?.type === 'trigger' && targetNode.data.properties?.sourceSensor) {
            sensorIds.push(targetNode.data.properties.sourceSensor);
          }
        }
      });
      
      setConnectedSensors(sensorIds);
    };
    
    // Initial update
    updateConnectedSensors();
    
    // Set a periodic checker instead of event listener due to ReactFlow API limitations
    const checkInterval = setInterval(() => {
      updateConnectedSensors();
    }, 2000);
    
    return () => {
      clearInterval(checkInterval);
    };
  }, [id, reactFlowInstance]);
  
  // Subscribe to flow data events
  useEffect(() => {
    if (!id || connectedSensors.length === 0) return;
    
    const handleFlowData = (flowData: any) => {
      // Only add data if there's an actual value to display
      if (flowData.value !== undefined && flowData.sensorId && connectedSensors.includes(flowData.sensorId)) {
        const newData = {
          timestamp: new Date().toLocaleTimeString(),
          source: flowData.source || 'unknown',
          sourceName: flowData.sourceName || 'unknown',
          target: flowData.target || 'unknown',
          targetName: flowData.targetName || 'unknown',
          sensorType: flowData.sensorType,
          value: flowData.value,
          data: flowData.data || {}
        };
        
        setDebugData(prev => {
          const maxEntries = data.properties?.maxEntries || 5;
          const updatedData = [newData, ...prev].slice(0, maxEntries);
          return updatedData;
        });
      }
    };
    
    // Get connected edges and look for real sensor data from connected sensors only
    const identifyRealConnections = () => {
      const edges = reactFlowInstance.getEdges();
      const nodes = reactFlowInstance.getNodes();
      
      // Find edges where this debug node is the source or target
      const connectedEdges = edges.filter(edge => 
        edge.source === id || edge.target === id
      );
      
      // For each connected edge, check for actual sensor data
      connectedEdges.forEach(edge => {
        const sourceNode = nodes.find(node => node.id === edge.source);
        const targetNode = nodes.find(node => node.id === edge.target);
        
        if (sourceNode && targetNode) {
          // Only create flow data for device nodes with actual sensor values
          if (sourceNode.type === 'device' && sourceNode.data.properties?.sensors) {
            // Only check sensors that are specifically connected
            sourceNode.data.properties.sensors.forEach((sensor: any) => {
              if (sensor.value !== undefined && connectedSensors.includes(sensor.id)) {
                // Create flow data with actual sensor data
                handleFlowData({
                  path: [id],
                  source: sourceNode.id,
                  sourceName: sourceNode.data.label,
                  target: targetNode.id,
                  targetName: targetNode.data.label,
                  sensorType: sensor.sensorType,
                  sensorId: sensor.id,
                  value: sensor.value,
                  data: { 
                    [sensor.sensorType]: sensor.value,
                    unit: sensor.sensorType === 'temperature' ? "°C" : 
                          sensor.sensorType === 'humidity' ? "%" : "",
                    timestamp: new Date().toISOString()
                  }
                });
              }
            });
          }
        }
      });
    };
    
    // Check for real data periodically
    const interval = setInterval(() => {
      identifyRealConnections();
    }, 3000);
    
    // Listen for real-time updates via WebSocket
    const handleTelemetryUpdate = (telemetryData: any) => {
      // Find connected device that matches this telemetry
      const edges = reactFlowInstance.getEdges();
      const nodes = reactFlowInstance.getNodes();
      
      const deviceNode = nodes.find(node => 
        node.type === 'device' && node.id === telemetryData.deviceId
      );
      
      if (deviceNode) {
        // Check if the device is connected to this debug node
        const isConnected = edges.some(edge => 
          (edge.source === deviceNode.id && edge.target === id) ||
          (edge.target === deviceNode.id && edge.source === id)
        );
        
        if (isConnected && telemetryData.data) {
          // Extract sensor data from telemetry but only for connected sensors
          const deviceSensors = deviceNode.data.properties?.sensors || [];
          
          deviceSensors.forEach((sensor: any) => {
            // Only process connected sensors
            if (connectedSensors.includes(sensor.id) && telemetryData.data[sensor.sensorType] !== undefined) {
              handleFlowData({
                path: [id],
                source: deviceNode.id,
                sourceName: deviceNode.data.label,
                target: id,
                targetName: data.label || "Debug",
                sensorType: sensor.sensorType,
                sensorId: sensor.id,
                value: telemetryData.data[sensor.sensorType],
                data: { [sensor.sensorType]: telemetryData.data[sensor.sensorType] }
              });
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
          <span>Connected Sensors:</span>
          <span>{connectedSensors.length}</span>
        </div>
      </div>
      
      {expanded && (
        <div className="mt-3 border-t border-[#D9E4DD] pt-2">
          <h4 className="text-xs font-medium text-[#5C6E91] mb-1">
            {debugData.length > 0 ? "Real Sensor Data:" : "Waiting for Data:"}
          </h4>
          {debugData.length > 0 ? (
            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
              {debugData.map((item, index) => (
                <div key={index} className="bg-[#F8F6F0] p-1.5 rounded text-[10px] text-[#5C6E91]">
                  <div className="flex items-center gap-1 mb-1">
                    {getSensorIcon(item.sensorType)}
                    <span className="font-medium">{item.timestamp}</span>
                    {item.value !== undefined && (
                      <span className="ml-auto font-bold">
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
                <p>Waiting for data from connected sensors...</p>
              ) : (
                <>
                  <p>Connect to specific sensor handles</p>
                  <p className="text-[9px] mt-1">Use sensor connection points from device nodes</p>
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