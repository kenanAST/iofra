import { memo, useState, useEffect, useCallback } from "react"
import { Handle, Position, type NodeProps, useReactFlow } from "reactflow"
import { MessageSquare, SendHorizonal, Check, AlertCircle, CornerRightDown, ArrowRight, AlertTriangle, Trash2, Clock, Timer, Edit2 } from "lucide-react"
import wsClient from "@/lib/websocket-client"

interface ResponseData {
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
  actionTaken?: boolean;
  actionType?: string;
  actionSuccess?: boolean;
  message?: string;
}

export const ResponseNode = memo(({ data, isConnectable, id }: NodeProps) => {
  const [responseHistory, setResponseHistory] = useState<ResponseData[]>([]);
  const [hasIncomingConnection, setHasIncomingConnection] = useState<boolean>(false);
  const [hasValidInput, setHasValidInput] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(true);
  const [lastActionStatus, setLastActionStatus] = useState<'none' | 'success' | 'error'>('none');
  // Track countdown state per source
  const [countdowns, setCountdowns] = useState<Record<string, number>>({});
  // Pending trigger data that will be sent when countdown reaches zero
  const [pendingTriggers, setPendingTriggers] = useState<Record<string, any>>({});
  // Track the total number of suppressed triggers
  const [accumulatedCount, setAccumulatedCount] = useState<number>(0);
  // State for countdown input
  const [countdownInput, setCountdownInput] = useState<string>("");
  const [isEditingCountdown, setIsEditingCountdown] = useState<boolean>(false);
  // Track if countdown is active
  const [isCountdownActive, setIsCountdownActive] = useState<boolean>(false);
  
  const reactFlowInstance = useReactFlow();
  
  // Get the initial countdown value from properties or default to 5 seconds
  const getInitialCountdown = useCallback(() => {
    return data.properties?.countdownStart || 5;
  }, [data.properties?.countdownStart]);
  
  // Format seconds to HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };
  
  // Parse HH:MM:SS to seconds
  const parseTimeToSeconds = (timeStr: string): number => {
    const parts = timeStr.split(':').map(part => parseInt(part, 10));
    
    if (parts.length === 3 && !parts.some(isNaN)) {
      const [hours, minutes, seconds] = parts;
      return hours * 3600 + minutes * 60 + seconds;
    }
    
    // If not a valid time format, try parsing as seconds
    const seconds = parseInt(timeStr, 10);
    return isNaN(seconds) ? 5 : seconds;
  };
  
  // Validate connection logic
  const validateConnection = useCallback(() => {
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
      if (sourceNode.type === 'trigger') {
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
  
  // Update connection status periodically
  useEffect(() => {
    const checkConnection = () => {
      const isValid = validateConnection();
      setHasValidInput(isValid);
      
      const currentEdges = reactFlowInstance.getEdges();
      const hasInputs = currentEdges.some(edge => edge.target === id);
      setHasIncomingConnection(hasInputs);
    };

    // Initial check
    checkConnection();

    // Set up interval to check connection status
    const intervalId = setInterval(checkConnection, 1000);

    return () => clearInterval(intervalId);
  }, [id, reactFlowInstance, validateConnection]);
  
  // Check if data has conditions met to execute a response
  const shouldExecuteResponse = useCallback((inputData: any) => {
    // If data comes from a trigger, check if condition is met
    if (inputData.triggerInfo && !inputData.conditionMet) {
      return false;
    }
    
    // For debug nodes or devices, we consider any valid non-zero data as actionable
    if (inputData.value !== undefined && inputData.value !== null && inputData.value !== 0) {
      return true;
    }
    
    return false;
  }, []);
  
  // Time-based countdown effect
  useEffect(() => {
    if (!isCountdownActive) return;
    
    const intervalId = setInterval(() => {
      setCountdowns(prev => {
        const newCountdowns = { ...prev };
        let shouldExecute = false;
        
        Object.entries(newCountdowns).forEach(([sourceId, count]) => {
          if (count > 0) {
            newCountdowns[sourceId] = count - 1;
            if (count === 1) {
              shouldExecute = true;
            }
          }
        });
        
        return newCountdowns;
      });
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [isCountdownActive]);
  
  // Process triggers with countdown logic
  const handleTriggerWithCountdown = useCallback((inputData: any) => {
    const sourceId = inputData.source;
    
    // Initialize countdown for this source if needed
    if (countdowns[sourceId] === undefined) {
      setCountdowns(prev => ({
        ...prev,
        [sourceId]: getInitialCountdown()
      }));
      setIsCountdownActive(true);
    }
    
    // Store the input data
    setPendingTriggers(prevTriggers => ({
      ...prevTriggers,
      [sourceId]: inputData
    }));
    
    // Increment total accumulation count
    setAccumulatedCount(count => count + 1);
  }, [countdowns, getInitialCountdown]);
  
  // Execute the configured response action
  const executeResponse = useCallback((inputData: any) => {
    const actionType = data.properties?.action || "email"; // Default to email
    const recipient = data.properties?.recipient || "admin@example.com";
    const messageTemplate = data.properties?.message || "Alert triggered from {sensorType} with value {value}";
    
    // Prepare data values for message template
    let messageWithValues = messageTemplate;
    if (inputData.value !== undefined) {
      messageWithValues = messageWithValues.replace("{value}", inputData.value);
    }
    if (inputData.sensorType) {
      messageWithValues = messageWithValues.replace("{sensorType}", inputData.sensorType);
    }
    
    // Create a new response history entry
    const responseEntry: ResponseData = {
      ...inputData,
      timestamp: new Date().toLocaleTimeString(),
      target: id,
      targetName: data.label || "Response",
      actionTaken: true,
      actionType: actionType,
      actionSuccess: false, // Will be updated after action is taken
      message: messageWithValues
    };
    
    // Execute the action based on type
    try {
      switch (actionType) {
        case "notification":
          // Simulate sending a notification
          console.log(`NOTIFICATION to ${recipient}: ${messageWithValues}`);
          
          // In a real implementation, you would call an API or service
          // For example:
          // wsClient.send(JSON.stringify({
          //   type: 'notification',
          //   recipient,
          //   message: messageWithValues,
          //   sourceData: inputData
          // }));
          
          responseEntry.actionSuccess = true;
          break;
          
        case "email":
          console.log(`EMAIL to ${recipient}: ${messageWithValues}`);
          
          // SendGrid implementation example
          // First, install SendGrid: npm install @sendgrid/mail
          // Then add to the top of this file: import sgMail from '@sendgrid/mail';
          // sgMail.setApiKey('YOUR_SENDGRID_API_KEY');
          // const msg = {
          //   to: recipient,
          //   from: 'your-verified-sender@example.com',
          //   subject: `IoFRA Alert: ${inputData.sensorType || 'Sensor'} Trigger`,
          //   text: messageWithValues,
          //   html: `<strong>${messageWithValues}</strong>`,
          // };
          // sgMail.send(msg)
          //   .then(() => {
          //     console.log('Email sent successfully');
          //   })
          //   .catch((error) => {
          //     console.error(error);
          //   });
          
          responseEntry.actionSuccess = true;
          break;
          
        case "sms":
          console.log(`SMS to ${recipient}: ${messageWithValues}`);
          responseEntry.actionSuccess = true;
          break;
          
        case "webhook":
          console.log(`WEBHOOK call to ${recipient} with payload:`, inputData.data);
          responseEntry.actionSuccess = true;
          break;
          
        case "mqtt":
          console.log(`MQTT publish to topic ${recipient}: ${messageWithValues}`);
          responseEntry.actionSuccess = true;
          break;
          
        default:
          console.log(`Unknown action type: ${actionType}`);
          responseEntry.actionSuccess = false;
      }
      
      // Update status based on action success
      setLastActionStatus(responseEntry.actionSuccess ? 'success' : 'error');
      
      // Reset the countdown for this source
      const sourceId = inputData.source;
      setCountdowns(prev => ({
        ...prev,
        [sourceId]: getInitialCountdown()
      }));
      
      // Reset accumulated count after sending
      setAccumulatedCount(0);
      
      // Add to response history
      setResponseHistory(prev => {
        const maxEntries = data.properties?.maxEntries || 5;
        return [responseEntry, ...prev].slice(0, maxEntries);
      });
      
    } catch (error) {
      console.error("Error executing response action:", error);
      responseEntry.actionSuccess = false;
      setLastActionStatus('error');
      
      setResponseHistory(prev => {
        const maxEntries = data.properties?.maxEntries || 5;
        return [responseEntry, ...prev].slice(0, maxEntries);
      });
    }
  }, [id, data.properties, data.label, getInitialCountdown, accumulatedCount]);
  
  // Check zero countdowns and execute responses
  useEffect(() => {
    // Find sources with zero countdown and execute their responses
    Object.entries(countdowns).forEach(([sourceId, count]) => {
      if (count === 0 && pendingTriggers[sourceId]) {
        // Execute response and reset the countdown
        executeResponse(pendingTriggers[sourceId]);
        
        // Clear pending trigger after executing
        setPendingTriggers(prev => {
          const newPending = { ...prev };
          delete newPending[sourceId];
          return newPending;
        });
      }
    });
  }, [countdowns, pendingTriggers, executeResponse]);
  
  // Process data from connected nodes
  useEffect(() => {
    if (!id) return;
    
    // Check connection status
    const isValid = validateConnection();
    setHasValidInput(isValid);
    
    const currentEdges = reactFlowInstance.getEdges();
    const hasInputs = currentEdges.some(edge => edge.target === id);
    setHasIncomingConnection(hasInputs);
    
    // Get data from upstream nodes
    const checkForTriggerData = () => {
      if (!isValid) return;
      
      const edges = reactFlowInstance.getEdges();
      const nodes = reactFlowInstance.getNodes();
      
      // Find incoming edges
      const incomingEdges = edges.filter(edge => edge.target === id);
      
      incomingEdges.forEach(edge => {
        const sourceNodeId = edge.source;
        const sourceNode = nodes.find(node => node.id === sourceNodeId);
        
        if (!sourceNode) return;
        
        // Process trigger nodes
        if (sourceNode.type === 'trigger' && sourceNode.data.isTriggered) {
          const triggerData = {
            timestamp: new Date().toLocaleTimeString(),
            source: sourceNodeId,
            sourceName: sourceNode.data.label || 'Trigger',
            target: id,
            targetName: data.label || 'Response',
            sensorType: sourceNode.data.sensorType || 'temperature',
            value: sourceNode.data.currentValue,
            data: { value: sourceNode.data.currentValue },
            conditionMet: true,
            triggerInfo: {
              condition: sourceNode.data.properties?.condition || '>',
              threshold: sourceNode.data.properties?.threshold || 0
            }
          };
          
          if (shouldExecuteResponse(triggerData)) {
            handleTriggerWithCountdown(triggerData);
          }
        }
        
        // Process debug nodes
        else if (sourceNode.type === 'debug' && 
                sourceNode.data.debugData?.length > 0 && 
                sourceNode.data.debugData[0].source !== 'no_input') {
          const debugData = sourceNode.data.debugData[0];
          
          const inputData = {
            timestamp: new Date().toLocaleTimeString(),
            source: sourceNodeId,
            sourceName: sourceNode.data.label || 'Debug',
            target: id,
            targetName: data.label || 'Response',
            sensorType: debugData.sensorType,
            value: debugData.value,
            data: debugData.data || {},
            conditionMet: debugData.conditionMet,
            triggerInfo: debugData.triggerInfo
          };
          
          if (shouldExecuteResponse(inputData)) {
            handleTriggerWithCountdown(inputData);
          }
        }
        
        // Process device nodes
        else if (sourceNode.type === 'device' && 
                sourceNode.data.properties?.status === 'online') {
          if (sourceNode.data.properties?.sensors) {
            const sensors = sourceNode.data.properties.sensors;
            
            // Process specific sensor handle if exists
            if (edge.sourceHandle && edge.sourceHandle.startsWith('sensor-')) {
              const sensorId = edge.sourceHandle.replace('sensor-', '');
              const sensor = sensors.find((s: any) => s.id === sensorId);
              
              if (sensor && sensor.value !== undefined) {
                const deviceData = {
                  timestamp: new Date().toLocaleTimeString(),
                  source: sourceNodeId,
                  sourceName: sourceNode.data.label || "Device",
                  target: id,
                  targetName: data.label || "Response",
                  sensorType: sensor.sensorType,
                  value: sensor.value,
                  data: { [sensor.sensorType]: sensor.value },
                  conditionMet: true
                };
                
                if (shouldExecuteResponse(deviceData)) {
                  handleTriggerWithCountdown(deviceData);
                }
              }
            }
          }
        }
      });
    };
    
    // Initial check
    checkForTriggerData();
    
    // Set up interval to periodically check for new data
    const intervalId = setInterval(checkForTriggerData, 2000);
    
    return () => clearInterval(intervalId);
  }, [id, reactFlowInstance, validateConnection, shouldExecuteResponse, handleTriggerWithCountdown]);
  
  // Listen for data changes from connected nodes
  useEffect(() => {
    if (!id) return;
    
    // Set up watcher for trigger events
    const handleTriggerChange = (e: any) => {
      try {
        const event = JSON.parse(e.data);
        if (event.type === 'trigger' && event.nodeId) {
          // Find if we're connected to this trigger
          const edges = reactFlowInstance.getEdges();
          const isConnected = edges.some(edge => 
            edge.target === id && edge.source === event.nodeId
          );
          
          if (isConnected) {
            // Force a check for trigger data
            const isValid = validateConnection();
            if (isValid) {
              const nodes = reactFlowInstance.getNodes();
              const triggerNode = nodes.find(node => node.id === event.nodeId);
              
              if (triggerNode && triggerNode.data.isTriggered) {
                const triggerData = {
                  timestamp: new Date().toLocaleTimeString(),
                  source: event.nodeId,
                  sourceName: triggerNode.data.label || 'Trigger',
                  target: id,
                  targetName: data.label || 'Response',
                  sensorType: triggerNode.data.sensorType || 'temperature',
                  value: triggerNode.data.currentValue,
                  data: { value: triggerNode.data.currentValue },
                  conditionMet: true,
                  triggerInfo: {
                    condition: triggerNode.data.properties?.condition || '>',
                    threshold: triggerNode.data.properties?.threshold || 0
                  }
                };
                
                if (shouldExecuteResponse(triggerData)) {
                  handleTriggerWithCountdown(triggerData);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error processing trigger event:", error);
      }
    };
    
    // In a real implementation, connect to websocket or event stream
    // wsClient.addEventListener('message', handleTriggerChange);
    
    // return () => {
    //   wsClient.removeEventListener('message', handleTriggerChange);
    // };
  }, [id, reactFlowInstance, validateConnection, shouldExecuteResponse, handleTriggerWithCountdown]);
  
  // Function to clear response history
  const clearResponseHistory = () => {
    setResponseHistory([]);
    setLastActionStatus('none');
    setAccumulatedCount(0);
    
    // Reset all countdowns to initial values
    const resetCountdowns: Record<string, number> = {};
    Object.keys(countdowns).forEach(sourceId => {
      resetCountdowns[sourceId] = getInitialCountdown();
    });
    setCountdowns(resetCountdowns);
    setPendingTriggers({});
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
  
  // Get lowest countdown value for display
  const getLowestCountdown = () => {
    const values = Object.values(countdowns);
    if (values.length === 0) return getInitialCountdown();
    
    // Return the lowest non-zero value, or 0 if any countdown is at 0
    const lowestCount = Math.min(...values);
    return lowestCount;
  };
  
  // Handle countdown input change
  const handleCountdownInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCountdownInput(e.target.value);
  };
  
  // Handle countdown input submit
  const handleCountdownSubmit = () => {
    const newValue = parseTimeToSeconds(countdownInput);
    if (newValue > 0) {
      // Update the node's properties
      if (data.properties) {
        data.properties.countdownStart = newValue;
      } else {
        data.properties = { countdownStart: newValue };
      }
      
      // Reset all countdowns to the new value
      const resetCountdowns: Record<string, number> = {};
      Object.keys(countdowns).forEach(sourceId => {
        resetCountdowns[sourceId] = newValue;
      });
      setCountdowns(resetCountdowns);
      
      // Reset accumulated count
      setAccumulatedCount(0);
      
      // Clear pending triggers
      setPendingTriggers({});
    }
    
    // Reset input state
    setCountdownInput("");
    setIsEditingCountdown(false);
  };
  
  // Handle countdown input key press
  const handleCountdownKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCountdownSubmit();
    } else if (e.key === 'Escape') {
      setCountdownInput("");
      setIsEditingCountdown(false);
    }
  };
  
  return (
    <div className={`relative bg-white rounded-lg border border-[#D9E4DD] shadow-sm p-3 ${expanded ? 'w-64' : 'w-48'}`}>
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable && !hasIncomingConnection}
        className={`w-3 h-3 bg-[#CBAACB] border-2 border-white ${hasIncomingConnection ? 'opacity-50 cursor-not-allowed' : ''}`}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#CBAACB] flex items-center justify-center mr-2">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#5C6E91]">{data.label || "Response"}</h3>
            <p className="text-xs text-[#7A8CA3]">{data.properties?.action || "Notification"}</p>
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
          <span className={lastActionStatus === 'success' ? "text-green-500" : 
                           lastActionStatus === 'error' ? "text-red-500" : 
                           hasIncomingConnection ? "text-orange-400" : "text-red-500"}>
            {lastActionStatus === 'success' ? "Action Sent" : 
             lastActionStatus === 'error' ? "Action Failed" :
             hasIncomingConnection ? (hasValidInput ? "Connected (Waiting)" : "Invalid Input") : "No Input"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Recipient:</span>
          <span className="truncate max-w-[100px]">{data.properties?.recipient || "admin"}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Countdown:</span>
          {isEditingCountdown ? (
            <div className="flex items-center">
              <input
                type="text"
                placeholder="HH:MM:SS"
                value={countdownInput}
                onChange={handleCountdownInputChange}
                onKeyDown={handleCountdownKeyPress}
                className="w-20 h-5 text-xs border border-[#D9E4DD] rounded px-1"
                autoFocus
              />
              <button 
                onClick={handleCountdownSubmit}
                className="ml-1 text-xs text-green-600 hover:text-green-800"
              >
                ✓
              </button>
            </div>
          ) : (
            <div className="flex items-center">
              <span className="flex items-center font-medium">
                <Timer className="h-3 w-3 mr-1" />
                {formatTime(getLowestCountdown())}
              </span>
              <button 
                onClick={() => {
                  setCountdownInput(formatTime(getInitialCountdown()));
                  setIsEditingCountdown(true);
                }}
                className="ml-1 text-[#7A8CA3] hover:text-[#5C6E91]"
                title="Edit countdown"
              >
                <Edit2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {expanded && (
        <div className="mt-3 border-t border-[#D9E4DD] pt-2">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-xs font-medium text-[#5C6E91]">
              {responseHistory.length > 0 ? "Action History" : "Waiting for Input"}
            </h4>
            {responseHistory.length > 0 && (
              <button 
                onClick={clearResponseHistory}
                className="text-xs text-[#7A8CA3] hover:text-red-500 transition-colors p-1 flex items-center"
                title="Clear history"
              >
                <Trash2 className="h-3 w-3" />
                <span className="ml-1">Clear</span>
              </button>
            )}
          </div>
          
          {responseHistory.length > 0 ? (
            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
              {responseHistory.map((item, index) => (
                <div key={index} className="bg-[#F8F6F0] p-1.5 rounded text-[10px] text-[#5C6E91]">
                  <div className="flex items-center gap-1 mb-1">
                    <SendHorizonal className="h-3 w-3 text-[#CBAACB]" />
                    <span className="font-medium">{item.timestamp}</span>
                    {item.actionSuccess ? (
                      <Check className="h-3 w-3 text-green-500 ml-auto" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-red-500 ml-auto" />
                    )}
                  </div>
                  
                  <div className="flex items-center mb-1">
                    <span className="bg-[#E2F0F7] px-1 py-0.5 rounded truncate max-w-[96px]" title={item.sourceName}>
                      {item.sourceName}
                    </span>
                    <CornerRightDown className="h-3 w-3 mx-1 text-[#CBAACB]" />
                    <span className="bg-[#E2F0F7] px-1 py-0.5 rounded truncate max-w-[96px]" title={item.targetName}>
                      {item.targetName}
                    </span>
                  </div>
                  
                  <div className="flex flex-col mt-1">
                    <div className="flex items-center">
                      <ArrowRight className="h-3 w-3 text-[#CBAACB] mr-1" />
                      <span className="text-[9px] font-medium">
                        {item.actionType}: {formatValue(item.value, item.sensorType)}
                      </span>
                    </div>
                    
                    <div className="mt-1 bg-[#E2F0F7] p-1 rounded text-[8px] break-words">
                      {item.message}
                    </div>
                  </div>
                  
                  {item.triggerInfo && (
                    <div className="mt-1 flex items-center">
                      <AlertTriangle className="h-3 w-3 text-[#FECDA6] mr-1" />
                      <span className="text-[#FECDA6] text-[9px]">
                        Triggered: {formatValue(item.value, item.sensorType)} {item.triggerInfo.condition} {item.triggerInfo.threshold}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-16 text-[#7A8CA3] text-xs">
              {hasValidInput ? (
                <>
                  <p>Connected and waiting for triggers</p>
                  <p className="text-[9px] mt-1">
                    Will send {data.properties?.action || "notification"} after {formatTime(getInitialCountdown())}
                  </p>
                </>
              ) : (
                <>
                  <p>Connect to triggers or sensors</p>
                  <p className="text-[9px] mt-1">No actions will be taken until connected</p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
})

ResponseNode.displayName = "ResponseNode"
