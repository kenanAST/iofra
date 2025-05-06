import { memo, useState, useEffect, useRef, useCallback } from "react"
import { Handle, Position, type NodeProps, useReactFlow } from "reactflow"
import { Search, ArrowRight, CornerRightDown, Thermometer, ArrowUpRight, Droplets, AlertTriangle, Trash2 } from "lucide-react"
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
  const [hasIncomingConnection, setHasIncomingConnection] = useState<boolean>(false);
  const [hasValidInput, setHasValidInput] = useState<boolean>(false);
  const [defaultValue, setDefaultValue] = useState<number>(0); // Default value when no input is connected
  
  const reactFlowInstance = useReactFlow();
  
  // Force check connections when this flag changes
  const forceUpdateFlag = data.forceConnectionUpdate;
  
  // Use a ref to track the last checkSourceDebug value to avoid infinite loops
  const lastCheckSourceDebugRef = useRef<number>(0);
  
  // Function to check if a connection is valid (source exists, is enabled, etc.)
  const validateConnection = useCallback(() => {
    // A connection is valid if:
    // 1. There is an incoming edge
    // 2. The source node exists
    // 3. For triggers: the trigger EXISTS (not necessarily triggered)
    // 4. For devices: the device is online and has the sensor
    
    // Get fresh edges and nodes
    const edges = reactFlowInstance.getEdges();
    const nodes = reactFlowInstance.getNodes();
    
    // Check if we have any incoming edges
    const incomingEdges = edges.filter(edge => edge.target === id);
    if (incomingEdges.length === 0) {
      return false;
    }
    
    // At least one incoming edge must be valid
    let hasAnyValidInput = false;
    
    for (const edge of incomingEdges) {
      const sourceNodeId = edge.source;
      const sourceNode = nodes.find(node => node.id === sourceNodeId);
      
      // Source node must exist
      if (!sourceNode) continue;
      
      // If source is a trigger, consider it a valid connection
      // even if not triggered - for Debug nodes, we want to show
      // the connection even before it's triggered
      if (sourceNode.type === 'trigger') {
        // For triggers, we consider the connection valid even if the trigger
        // is not activated yet - Debug should show status immediately
        hasAnyValidInput = true;
        break;
      }
      // If source is a debug node, it must have valid data itself
      else if (sourceNode.type === 'debug') {
        if (sourceNode.data.debugData?.length > 0 && 
            sourceNode.data.debugData[0].source !== 'no_input') {
          hasAnyValidInput = true;
          break;
        }
      }
      // If source is a device, it must be online
      else if (sourceNode.type === 'device') {
        if (sourceNode.data.properties?.status === 'online') {
          // Must have at least one connected sensor
          const sourceHandle = edge.sourceHandle;
          if (sourceHandle && sourceHandle.startsWith('sensor-')) {
            hasAnyValidInput = true;
            break;
          }
        }
      }
    }
    
    return hasAnyValidInput;
  }, [id, reactFlowInstance]);
  
  // A separate function to check if we have actual data flowing (for UI display purposes)
  const hasActiveData = useCallback(() => {
    const edges = reactFlowInstance.getEdges();
    const nodes = reactFlowInstance.getNodes();
    
    // No edges = no data
    const incomingEdges = edges.filter(edge => edge.target === id);
    if (incomingEdges.length === 0) return false;
    
    // Check all edges for active data sources
    for (const edge of incomingEdges) {
      const sourceNodeId = edge.source;
      const sourceNode = nodes.find(node => node.id === sourceNodeId);
      
      if (!sourceNode) continue;
      
      // For triggers, they must be triggered to have active data
      if (sourceNode.type === 'trigger') {
        if (sourceNode.data.isTriggered && 
            sourceNode.data.currentValue !== undefined && 
            sourceNode.data.currentValue !== null &&
            sourceNode.data.currentValue !== 0) {
          return true;
        }
      }
      // For debug nodes, they must have non-zero data
      else if (sourceNode.type === 'debug') {
        if (sourceNode.data.debugData?.length > 0 && 
            sourceNode.data.debugData[0].source !== 'no_input' &&
            sourceNode.data.debugData[0].value !== 0) {
          return true;
        }
      }
      // For devices, check sensor data
      else if (sourceNode.type === 'device' && sourceNode.data.properties?.status === 'online') {
        const sensors = sourceNode.data.properties?.sensors;
        if (sensors) {
          if (edge.sourceHandle && edge.sourceHandle.startsWith('sensor-')) {
            const sensorId = edge.sourceHandle.replace('sensor-', '');
            const sensor = sensors.find((s: any) => s.id === sensorId);
            if (sensor && sensor.value !== undefined && sensor.value !== 0) {
              return true;
            }
          } else {
            // Check all sensors if no specific handle
            for (const sensor of sensors) {
              if (sensor.value !== undefined && sensor.value !== 0) {
                return true;
              }
            }
          }
        }
      }
    }
    
    return false;
  }, [id, reactFlowInstance]);
  
  // Re-validate input when a checkDataNow is called
  const checkDataNow = useCallback(() => {
    // Re-validate connection
    const isValid = validateConnection();
    const hasData = hasActiveData();
    setHasValidInput(isValid);
    
    // If no valid input or no data, ensure we show value 0
    if (!isValid || !hasData) {
      const edges = reactFlowInstance.getEdges();
      const nodes = reactFlowInstance.getNodes();
      const hasInputs = edges.some(edge => edge.target === id);
      
      // Check if we're connected to a trigger
      const connectedToTrigger = edges.some(edge => {
        const sourceNode = nodes.find(node => node.id === edge.source);
        return sourceNode?.type === 'trigger';
      });
      
      setDebugData([{
        timestamp: new Date().toLocaleTimeString(),
        source: "no_input",
        sourceName: !hasInputs ? "No Input" : 
                    connectedToTrigger ? "Waiting for Trigger" : 
                    isValid ? "Waiting for Data" : "Invalid Input",
        target: id,
        targetName: data.label || "Debug",
        sensorType: "value",
        value: 0,
        data: { value: 0 },
        conditionMet: false
      }]);
      return;
    }
    
    // Rest of the implementation continues only if we have valid data...
    // Get the current edges and nodes
    const edges = reactFlowInstance.getEdges();
    const nodes = reactFlowInstance.getNodes();
    
    // Check for active connections
    const incomingEdges = edges.filter(edge => edge.target === id);
    
    // Process each connection
    incomingEdges.forEach(edge => {
      const sourceNodeId = edge.source;
      const sourceNode = nodes.find(node => node.id === sourceNodeId);
      
      if (!sourceNode) return;
      
      // Process device connections
      if (sourceNode.type === 'device' && sourceNode.data.properties?.status === 'online') {
        if (sourceNode.data.properties?.sensors) {
          const sensors = sourceNode.data.properties.sensors;
          
          // Process specific sensor handle if exists
          if (edge.sourceHandle && edge.sourceHandle.startsWith('sensor-')) {
            const sensorId = edge.sourceHandle.replace('sensor-', '');
            const sensor = sensors.find((s: any) => s.id === sensorId);
            
            if (sensor && sensor.value !== undefined) {
              setDebugData(prev => {
                const newData = {
                  timestamp: new Date().toLocaleTimeString(),
                  source: sourceNodeId,
                  sourceName: sourceNode.data.label || "Device",
                  target: id,
                  targetName: data.label || "Debug",
                  sensorType: sensor.sensorType,
                  value: sensor.value,
                  data: { [sensor.sensorType]: sensor.value },
                  conditionMet: true
                };
                
                const maxEntries = data.properties?.maxEntries || 5;
                return [newData, ...prev].slice(0, maxEntries);
              });
            }
          }
        }
      }
      
      // Process trigger connections
      else if (sourceNode.type === 'trigger' && sourceNode.data.isTriggered) {
        const currentValue = sourceNode.data.currentValue;
        
        if (currentValue !== undefined && currentValue !== null) {
          const condition = sourceNode.data.properties?.condition || '>';
          const threshold = sourceNode.data.properties?.threshold || 0;
          
          setDebugData(prev => {
            const newData = {
              timestamp: new Date().toLocaleTimeString(),
              source: sourceNodeId,
              sourceName: sourceNode.data.label || 'Trigger',
              target: id,
              targetName: data.label || 'Debug',
              sensorType: 'temperature', // Default
              value: currentValue,
              data: { value: currentValue },
              conditionMet: true,
              triggerInfo: {
                condition: condition,
                threshold: threshold
              }
            };
            
            const maxEntries = data.properties?.maxEntries || 5;
            return [newData, ...prev].slice(0, maxEntries);
          });
        }
      }
      
      // Process debug connections
      else if (sourceNode.type === 'debug' && 
              sourceNode.data.debugData?.length > 0 && 
              sourceNode.data.debugData[0].source !== 'no_input') {
        const latestData = sourceNode.data.debugData[0];
        
        if (latestData) {
          setDebugData(prev => {
            const newData = {
              timestamp: new Date().toLocaleTimeString(),
              source: sourceNodeId,
              sourceName: sourceNode.data.label || 'Debug',
              target: id,
              targetName: data.label || 'Debug',
              sensorType: latestData.sensorType,
              value: latestData.value,
              data: latestData.data || {},
              conditionMet: true,
              triggerInfo: latestData.triggerInfo
            };
            
            const maxEntries = data.properties?.maxEntries || 5;
            return [newData, ...prev].slice(0, maxEntries);
          });
        }
      }
    });
  }, [id, reactFlowInstance, validateConnection, hasActiveData]);
  
  // Use this in the useEffect
  useEffect(() => {
    if (!id) return;
    
    // Update connection status
    const currentEdges = reactFlowInstance.getEdges();
    const nodes = reactFlowInstance.getNodes();
    const hasInputs = currentEdges.some(edge => edge.target === id);
    const isValid = validateConnection();
    const hasData = hasActiveData();
    
    // Check if we're connected to a trigger
    const connectedToTrigger = currentEdges.some(edge => {
      const sourceNode = nodes.find(node => node.id === edge.source);
      return sourceNode?.type === 'trigger';
    });
    
    setHasIncomingConnection(hasInputs);
    setHasValidInput(isValid);
    
    // Reset debug data to 0 if no valid input or no active data
    if (!isValid || !hasData) {
      // Create a default "no input" data entry with value 0
      setDebugData([{
        timestamp: new Date().toLocaleTimeString(),
        source: "no_input",
        sourceName: !hasInputs ? "No Input" : 
                    connectedToTrigger ? "Waiting for Trigger" : 
                    isValid ? "Waiting for Data" : "Invalid Input",
        target: id,
        targetName: data.label || "Debug",
        sensorType: "value",
        value: 0,
        data: { value: 0 },
        conditionMet: false
      }]);
    }
    
    // If this is a reconnection, force data propagation
    const isReconnection = data.reconnected || data.inputRemoved;
    
    // Call our callback function
    checkDataNow();
  }, [id, forceUpdateFlag, reactFlowInstance, data, validateConnection, hasActiveData, checkDataNow]);
  
  // Add effect to check for data when this node is receiving data from other nodes
  useEffect(() => {
    if (!id) return;
    
    // Check if we need to send data downstream 
    if (data.sendDataDownstream && debugData.length > 0 && debugData[0].source !== 'no_input') {
      // Find all outgoing connections
      const edges = reactFlowInstance.getEdges().filter(edge => edge.source === id);
      
      // Send our data to all connected debug nodes
      edges.forEach(edge => {
        const targetId = edge.target;
        
        // Signal to the target node that we're sending data
        reactFlowInstance.setNodes(nodes => 
          nodes.map(node => {
            if (node.id === targetId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  receivingData: {
                    source: id,
                    sourceData: debugData[0]
                  }
                }
              };
            }
            return node;
          })
        );
      });
    }
  }, [id, reactFlowInstance, data.sendDataDownstream, debugData]);
  
  // Add effect to receive data from other nodes
  useEffect(() => {
    if (!id || !data.receivingData) return;
    
    const { source, sourceData } = data.receivingData;
    
    // Only add if it's valid data
    if (sourceData && sourceData.source !== 'no_input') {
      setDebugData(prev => {
        // Check if we already have this exact entry
        const exists = prev.some(item => 
          item.source === sourceData.source && 
          item.timestamp === sourceData.timestamp
        );
        
        if (exists) return prev;
        
        // Create a new entry based on the received data
        const newData: DebugData = {
          timestamp: new Date().toLocaleTimeString(),
          source: sourceData.source,
          sourceName: sourceData.sourceName,
          target: id,
          targetName: data.label || 'Debug',
          sensorType: sourceData.sensorType,
          value: sourceData.value,
          data: sourceData.data || {},
          conditionMet: true,
          triggerInfo: sourceData.triggerInfo
        };
        
        const maxEntries = data.properties?.maxEntries || 5;
        return [newData, ...prev].slice(0, maxEntries);
      });
      
      // Mark as valid
      setHasValidInput(true);
    }
  }, [id, data.receivingData]);

  // Listen for reconnection events from the canvas
  useEffect(() => {
    if (!id) return;
    
    // If we just got reconnected, force a revalidation
    if (data.reconnected) {
      // Set a small delay to let the connection establish
      setTimeout(() => {
        // Force a fresh validation
        const isValid = validateConnection();
        setHasValidInput(isValid);
        
        // If valid, we need to force upstream nodes to send data
        if (isValid) {
          const edges = reactFlowInstance.getEdges();
          const nodes = reactFlowInstance.getNodes();
          
          // Find incoming edges
          const incomingEdges = edges.filter(edge => edge.target === id);
          
          // Tell all source nodes to send data
          incomingEdges.forEach(edge => {
            const sourceId = edge.source;
            const sourceNode = nodes.find(node => node.id === sourceId);
            
            if (!sourceNode) return;
            
            // Signal source to send data
            reactFlowInstance.setNodes(nodes => 
              nodes.map(node => {
                if (node.id === sourceId) {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      sendDataDownstream: Date.now()
                    }
                  };
                }
                return node;
              })
            );
          });
        }
      }, 200);
    }
  }, [id, data.reconnected, reactFlowInstance, validateConnection]);
  
  // Expose our debug data to other nodes
  useEffect(() => {
    if (!id) return;
    
    // Only update the node data if we have debug data
    if (debugData.length > 0) {
      const updateNodeData = () => {
        // Check connection status
        const isValid = validateConnection();
        
        // Force to default if not valid
        const dataToExpose = isValid ? debugData : [{
          timestamp: new Date().toLocaleTimeString(),
          source: "no_input",
          sourceName: "No Input",
          target: id,
          targetName: data.label || "Debug",
          sensorType: "value",
          value: 0,
          data: { value: 0 },
          conditionMet: false
        }];
        
        // Expose the debug data for other nodes to access
        reactFlowInstance.setNodes(nodes => 
          nodes.map(node => 
            node.id === id 
              ? { ...node, data: { ...node.data, debugData: dataToExpose } } 
              : node
          )
        );
      };
      
      // Use a debounce approach to prevent too many updates
      const timeoutId = setTimeout(updateNodeData, 100);
      return () => clearTimeout(timeoutId);
    } else {
      // If no debug data, set a default value of 0
      reactFlowInstance.setNodes(nodes => 
        nodes.map(node => 
          node.id === id 
            ? { ...node, data: { ...node.data, debugData: [{
                timestamp: new Date().toLocaleTimeString(),
                source: "no_input",
                sourceName: "No Input", 
                target: id,
                targetName: data.label || "Debug",
                sensorType: "value",
                value: 0,
                data: { value: 0 },
                conditionMet: false
              }] } } 
            : node
        )
      );
    }
  }, [id, debugData, reactFlowInstance, validateConnection]);
  
  // Function to clear debug data
  const clearDebugData = () => {
    // If no valid input, set to 0 rather than emptying
    if (!hasValidInput) {
      setDebugData([{
        timestamp: new Date().toLocaleTimeString(),
        source: "no_input",
        sourceName: "No Input",
        target: id,
        targetName: data.label || "Debug",
        sensorType: "value",
        value: 0,
        data: { value: 0 },
        conditionMet: false
      }]);
    } else {
      setDebugData([]);
    }
    
    // After clearing data, trigger a refresh by forcing a new check
    setTimeout(() => {
      // Recheck validity
      const isValid = validateConnection();
      setHasValidInput(isValid);
      
      // If not valid, ensure we're showing 0
      if (!isValid) {
        setDebugData([{
          timestamp: new Date().toLocaleTimeString(),
          source: "no_input",
          sourceName: "No Input",
          target: id,
          targetName: data.label || "Debug",
          sensorType: "value",
          value: 0,
          data: { value: 0 },
          conditionMet: false
        }]);
      }
      
      // Set a flag to force immediate repopulation
      reactFlowInstance.setNodes(nodes =>
        nodes.map(node => {
          // Update this node
          if (node.id === id) {
            return {
              ...node,
              data: {
                ...node.data,
                forceConnectionUpdate: Date.now()
              }
            };
          }
          
          return node;
        })
      );
    }, 50);
  };
  
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
        isConnectable={isConnectable && !hasIncomingConnection}
        className={`w-3 h-3 bg-[#86C5D8] border-2 border-white ${hasIncomingConnection ? 'opacity-50 cursor-not-allowed' : ''}`}
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
          <span className={hasActiveData() ? "text-green-500" : hasValidInput ? "text-orange-400" : "text-orange-400"}>
            {hasActiveData() ? "Active" : 
             hasValidInput && debugData[0]?.sourceName === "Waiting for Trigger" ? "Waiting for Trigger" :
             hasIncomingConnection ? "Connected (No Data)" : "No Input"}
          </span>
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
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-xs font-medium text-[#5C6E91]">
              {debugData.length > 0 && debugData[0].source !== "no_input" ? 
                "Data Flow" + (triggerCount > 0 ? " (Trigger Conditions Met)" : "") : 
                debugData[0]?.sourceName === "Waiting for Trigger" ? "Waiting for Trigger" :
                hasIncomingConnection && !hasValidInput ? "No Data from Input" : "Waiting for Input:"}
            </h4>
            {debugData.length > 0 && (
              <button 
                onClick={clearDebugData}
                className="text-xs text-[#7A8CA3] hover:text-red-500 transition-colors p-1 flex items-center"
                title="Clear debug data"
              >
                <Trash2 className="h-3 w-3" />
                <span className="ml-1">Clear</span>
              </button>
            )}
          </div>
          {debugData.length > 0 ? (
            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
              {debugData.map((item, index) => (
                <div key={index} className="bg-[#F8F6F0] p-1.5 rounded text-[10px] text-[#5C6E91]">
                  <div className="flex items-center gap-1 mb-1">
                    {getSensorIcon(item.sensorType)}
                    <span className="font-medium">{item.timestamp}</span>
                    {item.value !== undefined && (
                      <span className={`ml-auto font-bold ${
                        item.triggerInfo ? 'text-[#FECDA6]' : 
                        item.source === "no_input" ? 'text-gray-400' : ''
                      }`}>
                        {item.source === "no_input" ? "0 (No Input)" : formatValue(item.value, item.sensorType)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className={`bg-[#E2F0F7] px-1 py-0.5 rounded truncate max-w-[96px] ${item.source === "no_input" ? 'text-gray-400' : ''}`} title={item.sourceName}>
                      {item.sourceName}
                    </span>
                    <CornerRightDown className={`h-3 w-3 mx-1 ${item.source === "no_input" ? 'text-gray-400' : 'text-[#86C5D8]'}`} />
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
                  
                  {item.source === "no_input" && item.sourceName === "Waiting for Trigger" && (
                    <div className="mt-1 flex items-center">
                      <AlertTriangle className="h-3 w-3 text-[#FECDA6] mr-1" />
                      <span className="text-[#FECDA6] text-[9px]">
                        Connected to trigger - waiting for condition to be met
                      </span>
                    </div>
                  )}
                  {item.source === "no_input" && item.sourceName !== "Waiting for Trigger" && (
                    <div className="mt-1 flex items-center">
                      <AlertTriangle className="h-3 w-3 text-gray-400 mr-1" />
                      <span className="text-gray-400 text-[9px]">
                        {hasIncomingConnection ? "Invalid or inactive input" : "No input connection"} - showing default value
                      </span>
                    </div>
                  )}
                  
                  {data.properties?.capturePayload !== false && item.source !== "no_input" && (
                    <div className="mt-1 font-mono bg-[#E2F0F7] p-1 rounded overflow-x-auto whitespace-nowrap text-[8px]">
                      {JSON.stringify(item.data)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-16 text-[#7A8CA3] text-xs">
              {connectedSensors.length > 0 || hasIncomingConnection ? (
                triggerCount > 0 ? (
                  <>
                    <p>Waiting for trigger conditions to be met</p>
                    <p className="text-[9px] mt-1">Data will flow when conditions are satisfied</p>
                  </>
                ) : hasIncomingConnection ? (
                  <>
                    <p>Connected but no valid data</p>
                    <p className="text-[9px] mt-1">Check that input source is active</p>
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