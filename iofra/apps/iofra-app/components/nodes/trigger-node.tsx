import { memo, useState, useEffect, useCallback } from "react"
import { Handle, Position, type NodeProps, useReactFlow } from "reactflow"
import { Bell, AlertTriangle, CheckCircle2 } from "lucide-react"

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

// Format for display
const formatValue = (value: any, sensorType?: string): string => {
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

export const TriggerNode = memo(({ data, isConnectable, id }: NodeProps) => {
  const [isTriggered, setIsTriggered] = useState<boolean>(false);
  const [pulseAnimation, setPulseAnimation] = useState<boolean>(false);
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [sensorType, setSensorType] = useState<string>("");
  const [hasOutgoingConnection, setHasOutgoingConnection] = useState<boolean>(false);
  const [hasIncomingConnection, setHasIncomingConnection] = useState<boolean>(false);
  const [hasValidInput, setHasValidInput] = useState<boolean>(false);
  const [pipelinedValue, setPipelinedValue] = useState<number | null>(null);
  const reactFlowInstance = useReactFlow();

  // Function to validate input connection
  const validateInput = useCallback(() => {
    if (!id) return false;
    
    const edges = reactFlowInstance.getEdges();
    const nodes = reactFlowInstance.getNodes();
    
    // Check for incoming edges
    const incomingEdges = edges.filter(edge => edge.target === id);
    if (incomingEdges.length === 0) return false;
    
    // For TriggerNode, valid inputs are:
    // 1. Device nodes that exist and are online
    // 2. Trigger nodes that exist (even if not triggered)
    // 3. Debug nodes that exist and have valid data
    
    for (const edge of incomingEdges) {
      const sourceNodeId = edge.source;
      const sourceNode = nodes.find(node => node.id === sourceNodeId);
      
      if (!sourceNode) continue;
      
      // Case 1: Source is a device
      if (sourceNode.type === 'device') {
        // Device must be online
        if (sourceNode.data.properties?.status === 'online') {
          return true;
        }
      }
      // Case 2: Source is a trigger - just needs to exist
      else if (sourceNode.type === 'trigger') {
        return true;
      }
      // Case 3: Source is a debug node
      else if (sourceNode.type === 'debug') {
        // Debug node needs to have some data to be valid
        if (sourceNode.data.debugData?.length > 0) {
          return true;
        }
      }
    }
    
    return false;
  }, [id, reactFlowInstance]);
  
  // Add effect to auto-configure when connected to a device
  useEffect(() => {
    if (!id) return;
    
    // If we already have sourceDevice and sourceSensor configured, don't override
    if (data.properties?.sourceDevice && data.properties?.sourceSensor) {
      return;
    }
    
    // Check for incoming device connections
    const edges = reactFlowInstance.getEdges();
    const nodes = reactFlowInstance.getNodes();
    
    // Find device connections
    const deviceConnections = edges
      .filter(edge => edge.target === id)
      .map(edge => {
        const sourceNode = nodes.find(node => node.id === edge.source);
        return { edge, sourceNode };
      })
      .filter(conn => conn.sourceNode?.type === 'device' && 
                       conn.sourceNode.data.properties?.status === 'online');
    
    // If we have device connections but no configuration, auto-configure
    if (deviceConnections.length > 0 && (!data.properties?.sourceDevice || !data.properties?.sourceSensor)) {
      const firstDevice = deviceConnections[0].sourceNode;
      
      // Make sure firstDevice exists
      if (!firstDevice || !firstDevice.data || !firstDevice.data.properties) {
        return;
      }
      
      // Try to find a temperature sensor first, or use the first available sensor
      let sensorToUse: any = null;
      if (firstDevice.data.properties.sensors?.length > 0) {
        // Look for temperature sensor first
        sensorToUse = firstDevice.data.properties.sensors.find((s: any) => 
          s.sensorType?.toLowerCase() === 'temperature'
        );
        
        // If no temperature sensor, use the first available one
        if (!sensorToUse) {
          sensorToUse = firstDevice.data.properties.sensors[0];
        }
        
        if (sensorToUse) {
          // Auto-configure by updating the node data
          reactFlowInstance.setNodes(nodes => 
            nodes.map(node => {
              if (node.id === id) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    properties: {
                      ...node.data.properties,
                      sourceDevice: firstDevice.id,
                      sourceSensor: sensorToUse.id
                    }
                  }
                };
              }
              return node;
            })
          );
        }
      }
    }
  }, [id, reactFlowInstance, data.properties]);
  
  // Check if there's already an outgoing connection from this trigger
  useEffect(() => {
    if (!id) return;
    
    const checkConnections = () => {
      const edges = reactFlowInstance.getEdges();
      const outgoingConnections = edges.filter(edge => edge.source === id);
      setHasOutgoingConnection(outgoingConnections.length > 0);
      const incomingConnections = edges.filter(edge => edge.target === id);
      
      // Check if input is valid
      const isValid = validateInput();
      setHasValidInput(isValid);
      
      // If there was a connection but now there isn't, reset currentValue to 0
      if (hasIncomingConnection && incomingConnections.length === 0) {
        setCurrentValue(0);
        setPipelinedValue(null);
        setIsTriggered(false);
      }
      
      // If connection exists but isn't valid, also reset to 0
      if (incomingConnections.length > 0 && !isValid && currentValue !== 0) {
        setCurrentValue(0);
        setPipelinedValue(null);
        setIsTriggered(false);
      }
      
      setHasIncomingConnection(incomingConnections.length > 0);
    };
    
    // Initial check
    checkConnections();
    
    // Periodically check for changes in connections
    const intervalId = setInterval(checkConnections, 500);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [id, reactFlowInstance, hasIncomingConnection, currentValue, validateInput]);

  // Monitor connected sensor for real-time value changes
  useEffect(() => {
    if (!id) return;
    
    // Function to check if the trigger condition is met
    const checkTriggerCondition = () => {
      const nodes = reactFlowInstance.getNodes();
      const edges = reactFlowInstance.getEdges();
      
      // Check if input connection is valid
      const isValid = validateInput();
      setHasValidInput(isValid);
      
      // If no valid input, reset to 0
      if (!isValid) {
        if (isTriggered) setIsTriggered(false);
        if (currentValue !== 0) setCurrentValue(0);
        setPipelinedValue(null);
        return;
      }
      
      // Get trigger properties
      const condition = data.properties?.condition || ">";
      const threshold = data.properties?.threshold || 30;
      const sourceDeviceId = data.properties?.sourceDevice;
      const sourceSensorId = data.properties?.sourceSensor;
      
      // Check if another trigger is connected to this trigger
      const incomingEdgeFromTrigger = edges.find(edge =>
        edge.target === id &&
        nodes.find(n => n.id === edge.source)?.type === 'trigger'
      );
      
      // If there's a connected trigger that's active, we should pipeline its data
      if (incomingEdgeFromTrigger) {
        const sourceTriggerId = incomingEdgeFromTrigger.source;
        const sourceTriggerNode = nodes.find(n => n.id === sourceTriggerId);
        
        // If source trigger has data and is triggered, use its value in our pipeline
        if (sourceTriggerNode?.data.isTriggered) {
          // Get the value from the source trigger node
          const upstreamValue = sourceTriggerNode.data.currentValue !== undefined ? 
            sourceTriggerNode.data.currentValue : currentValue;
          
          // Pipeline the value
          setPipelinedValue(upstreamValue);
          
          // Use the pipelined value to evaluate our own condition
          if (upstreamValue !== null && upstreamValue !== undefined) {
            const conditionMet = evaluateTriggerCondition(upstreamValue, condition, threshold);
            
            // Only trigger animation if going from false to true
            if (conditionMet && !isTriggered) {
              setPulseAnimation(true);
              setTimeout(() => setPulseAnimation(false), 1000);
            }
            
            setIsTriggered(conditionMet);
            
            // Also update the current value to show what we're evaluating
            setCurrentValue(upstreamValue);
          }
          return; // Exit early as we've processed the pipeline
        } else {
          // Source trigger exists but is not triggered, set value to 0
          if (currentValue !== 0) setCurrentValue(0);
          if (isTriggered) setIsTriggered(false);
          setPipelinedValue(null);
          return;
        }
      }
      
      // Handle direct device connections with a configured sensor
      if (sourceDeviceId && sourceSensorId) {
        // Find the connected device node
        const deviceNode = nodes.find(node => node.id === sourceDeviceId);
        if (!deviceNode || deviceNode.type !== 'device') {
          if (isTriggered) setIsTriggered(false); // Reset if device node is gone
          if (currentValue !== 0) setCurrentValue(0);
          return;
        }
        
        // Check if device is offline - don't trigger if device is offline
        if (deviceNode.data.properties?.status === 'offline') {
          if (isTriggered) {
            setIsTriggered(false); // Reset trigger state if device is offline
          }
          if (currentValue !== 0) setCurrentValue(0);
          return;
        }
        
        // Find the sensor in the device
        const sensor = deviceNode.data.properties?.sensors?.find(
          (s: any) => s.id === sourceSensorId
        );
        
        if (sensor && sensor.value !== undefined) {
          // Save the sensor type for display
          setSensorType(sensor.sensorType);
          
          // Update the current value
          setCurrentValue(sensor.value);
          
          // Reset pipelined value when directly connected to a sensor
          setPipelinedValue(null);
          
          // Check if condition is met
          const conditionMet = evaluateTriggerCondition(sensor.value, condition, threshold);
          
          // Only trigger animation if going from false to true
          if (conditionMet && !isTriggered) {
            setPulseAnimation(true);
            setTimeout(() => setPulseAnimation(false), 1000);
          }
          
          setIsTriggered(conditionMet);
        } else {
          // Sensor doesn't exist or doesn't have a value
          if (currentValue !== 0) setCurrentValue(0);
          if (isTriggered) setIsTriggered(false);
        }
      } else if (!incomingEdgeFromTrigger) {
        // No sensor configured and no incoming trigger
        if (currentValue !== 0) setCurrentValue(0);
        if (isTriggered) setIsTriggered(false);
        setPipelinedValue(null);
      }
    };
    
    // Initial check
    checkTriggerCondition();
    
    // Set up periodic checking
    const intervalId = setInterval(checkTriggerCondition, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [id, data.properties, reactFlowInstance, isTriggered, currentValue, hasIncomingConnection, validateInput]);
  
  // Expose the triggered state and current value to the node data so other nodes can access it
  useEffect(() => {
    if (!id) return;
    
    // Check if input is valid
    const isValid = validateInput();
    
    // If not valid, ensure we're showing 0
    const valueToExpose = !isValid ? 0 : currentValue === null ? 0 : currentValue;
    
    // Update the node data to include the triggered state and current value
    reactFlowInstance.setNodes(nodes => 
      nodes.map(node => 
        node.id === id 
          ? { ...node, data: { ...node.data, isTriggered: isValid ? isTriggered : false, currentValue: valueToExpose } } 
          : node
      )
    );
  }, [id, isTriggered, currentValue, reactFlowInstance, validateInput]);
  
  // Add effect to respond to reconnection events
  useEffect(() => {
    if (!id) return;
    
    // If this node received a reconnection signal, revalidate the input
    if (data.reconnected || data.checkTrigger) {
      // Force check with a small delay to ensure connections are established
      setTimeout(() => {
        const isValid = validateInput();
        setHasValidInput(isValid);
        
        if (isValid) {
          // Force a check of the trigger condition to update the UI
          const nodes = reactFlowInstance.getNodes();
          const edges = reactFlowInstance.getEdges();
          
          // Check for incoming edges from devices or triggers
          const incomingEdges = edges.filter(edge => edge.target === id);
          
          incomingEdges.forEach(edge => {
            const sourceId = edge.source;
            const sourceNode = nodes.find(node => node.id === sourceId);
            
            if (!sourceNode) return;
            
            // For devices, check sensor data
            if (sourceNode.type === 'device' && sourceNode.data.properties?.status === 'online') {
              const sourceDeviceId = data.properties?.sourceDevice;
              const sourceSensorId = data.properties?.sourceSensor;
              
              if (sourceDeviceId === sourceId && sourceSensorId) {
                // Find the sensor
                const sensor = sourceNode.data.properties?.sensors?.find(
                  (s: any) => s.id === sourceSensorId
                );
                
                if (sensor && sensor.value !== undefined) {
                  // Update the current value
                  setCurrentValue(sensor.value);
                  setSensorType(sensor.sensorType);
                  
                  // Check if condition is met
                  const condition = data.properties?.condition || ">";
                  const threshold = data.properties?.threshold || 30;
                  const conditionMet = evaluateTriggerCondition(sensor.value, condition, threshold);
                  
                  // Update trigger state
                  setIsTriggered(conditionMet);
                  
                  // Only animate if going from false to true
                  if (conditionMet && !isTriggered) {
                    setPulseAnimation(true);
                    setTimeout(() => setPulseAnimation(false), 1000);
                  }
                }
              }
            }
            // For triggers, use pipeline data
            else if (sourceNode.type === 'trigger' && sourceNode.data.isTriggered) {
              const upstreamValue = sourceNode.data.currentValue;
              
              if (upstreamValue !== undefined && upstreamValue !== null) {
                setPipelinedValue(upstreamValue);
                setCurrentValue(upstreamValue);
                
                // Check if condition is met
                const condition = data.properties?.condition || ">";
                const threshold = data.properties?.threshold || 30;
                const conditionMet = evaluateTriggerCondition(upstreamValue, condition, threshold);
                
                // Update trigger state
                setIsTriggered(conditionMet);
                
                // Only animate if going from false to true
                if (conditionMet && !isTriggered) {
                  setPulseAnimation(true);
                  setTimeout(() => setPulseAnimation(false), 1000);
                }
              }
            }
          });
        } else {
          // No valid input, reset to 0
          setCurrentValue(0);
          setPipelinedValue(null);
          setIsTriggered(false);
        }
      }, 200);
    }
  }, [id, data.reconnected, data.checkTrigger, validateInput, reactFlowInstance, data.properties, isTriggered]);
  
  // Add effect to respond to input removal
  useEffect(() => {
    if (!id || !data.inputRemoved) return;
    
    // Reset values since input was removed
    setCurrentValue(0);
    setPipelinedValue(null);
    setIsTriggered(false);
    setHasValidInput(false);
  }, [id, data.inputRemoved]);
  
  // Derived values for display
  const condition = data.properties?.condition || ">";
  const threshold = data.properties?.threshold || 30;
  const topic = data.properties?.topic || "iot/alerts";
  const sourceDevice = data.properties?.sourceDevice || "";
  const sourceSensor = data.properties?.sourceSensor || "";
  const hasSourceConfigured = sourceDevice && sourceSensor;
  
  // Determine if we're showing a pipelined value or direct sensor value
  const displayValue = pipelinedValue !== null ? pipelinedValue : currentValue;
  const isPipelined = pipelinedValue !== null;
  
  return (
    <div className={`relative bg-white rounded-lg border ${
      pulseAnimation ? 'border-orange-500 shadow-[0_0_10px_rgba(254,205,166,0.7)]' :
      isTriggered ? 'border-orange-400 shadow-sm' : 'border-[#D9E4DD] shadow-sm'
    } p-3 w-48 transition-all duration-200`}>
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable && !hasIncomingConnection}
        className={`w-3 h-3 bg-[#FECDA6] border-2 border-white ${
          isTriggered ? 'ring-2 ring-orange-300' : ''
        } ${hasIncomingConnection ? 'opacity-50 cursor-not-allowed' : ''}`}
      />

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable && !hasOutgoingConnection}
        className={`w-3 h-3 bg-[#FECDA6] border-2 border-white ${
          isTriggered ? 'ring-2 ring-orange-300' : ''
        } ${hasOutgoingConnection ? 'opacity-50 cursor-not-allowed' : ''}`}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`flex-shrink-0 w-8 h-8 rounded-full ${
            isTriggered ? 'bg-orange-500' : 'bg-[#FECDA6]'
          } flex items-center justify-center mr-2 transition-colors duration-300`}>
            <Bell className={`h-4 w-4 text-white ${pulseAnimation ? 'animate-ping' : ''}`} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#5C6E91]">{data.label}</h3>
            <p className="text-xs text-[#7A8CA3]">
              Condition: {condition} {threshold}
            </p>
          </div>
        </div>
        {isTriggered && (
          <div className="text-orange-500">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        )}
      </div>

      {(hasSourceConfigured || isPipelined || (hasIncomingConnection && !hasValidInput)) && (
        <div className="mt-2 text-xs bg-[#FFF8F0] rounded p-1 border border-[#FECDA6]/30">
          <div className="flex justify-between items-center">
            <span className="text-[#7A8CA3]">
              {isPipelined ? "Pipeline:" : hasIncomingConnection && !hasValidInput ? "Input:" : "Current:"}
            </span>
            <span className={`font-medium ${isTriggered ? 'text-orange-500' : hasIncomingConnection && !hasValidInput ? 'text-gray-400' : 'text-[#5C6E91]'}`}>
              {hasIncomingConnection && !hasValidInput ? "0 (No Data)" : formatValue(displayValue, sensorType)} 
              <span className={isTriggered ? 'text-green-500' : ''}>
                {isTriggered ? ' ✓' : ''}
              </span>
            </span>
          </div>
        </div>
      )}

      <div className="mt-2 text-xs text-[#7A8CA3] bg-[#F8F6F0] rounded p-1">
        <div className="flex justify-between">
          <span>Topic:</span>
          <span>{topic}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Status:</span>
          <span className={hasValidInput ? "text-green-500" : "text-orange-400"}>
            {hasValidInput ? "Active" : hasIncomingConnection ? "Connected (No Data)" : "No Input"}
          </span>
        </div>
      </div>
      
      {!hasSourceConfigured && !isPipelined && !hasIncomingConnection && (
        <div className="mt-2 text-xs flex items-center">
          <AlertTriangle className="h-3 w-3 text-amber-500 mr-1" />
          <span className="text-amber-500">Configure source sensor</span>
        </div>
      )}
      {hasIncomingConnection && !hasSourceConfigured && !isPipelined && !reactFlowInstance.getEdges().find(edge => edge.target === id && reactFlowInstance.getNodes().find(n => n.id === edge.source)?.type === 'trigger') && (
        <div className="mt-2 text-xs flex items-center">
          <AlertTriangle className="h-3 w-3 text-amber-500 mr-1" />
          <span className="text-amber-500">Input connected, awaiting configuration or trigger pipeline.</span>
        </div>
      )}
      {hasIncomingConnection && !hasValidInput && (
        <div className="mt-2 text-xs flex items-center">
          <AlertTriangle className="h-3 w-3 text-amber-500 mr-1" />
          <span className="text-amber-500">Input source disabled or not providing data.</span>
        </div>
      )}
    </div>
  )
})

TriggerNode.displayName = "TriggerNode"

