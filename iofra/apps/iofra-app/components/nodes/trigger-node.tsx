import { memo, useState, useEffect } from "react"
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
  const reactFlowInstance = useReactFlow();

  // Monitor connected sensor for real-time value changes
  useEffect(() => {
    if (!id) return;
    
    // Function to check if the trigger condition is met
    const checkTriggerCondition = () => {
      const nodes = reactFlowInstance.getNodes();
      
      // Get trigger properties
      const condition = data.properties?.condition || ">";
      const threshold = data.properties?.threshold || 30;
      const sourceDeviceId = data.properties?.sourceDevice;
      const sourceSensorId = data.properties?.sourceSensor;
      
      if (!sourceDeviceId || !sourceSensorId) return;
      
      // Find the connected device node
      const deviceNode = nodes.find(node => node.id === sourceDeviceId);
      if (!deviceNode || deviceNode.type !== 'device') return;
      
      // Find the sensor in the device
      const sensor = deviceNode.data.properties?.sensors?.find(
        (s: any) => s.id === sourceSensorId
      );
      
      if (sensor && sensor.value !== undefined) {
        // Save the sensor type for display
        setSensorType(sensor.sensorType);
        
        // Update the current value
        setCurrentValue(sensor.value);
        
        // Check if condition is met
        const conditionMet = evaluateTriggerCondition(sensor.value, condition, threshold);
        
        // Only trigger animation if going from false to true
        if (conditionMet && !isTriggered) {
          setPulseAnimation(true);
          setTimeout(() => setPulseAnimation(false), 1000);
        }
        
        setIsTriggered(conditionMet);
      }
    };
    
    // Initial check
    checkTriggerCondition();
    
    // Set up periodic checking
    const intervalId = setInterval(checkTriggerCondition, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [id, data.properties, reactFlowInstance, isTriggered]);
  
  // Derived values for display
  const condition = data.properties?.condition || ">";
  const threshold = data.properties?.threshold || 30;
  const topic = data.properties?.topic || "iot/alerts";
  const sourceDevice = data.properties?.sourceDevice || "";
  const sourceSensor = data.properties?.sourceSensor || "";
  const hasSourceConfigured = sourceDevice && sourceSensor;
  
  return (
    <div className={`relative bg-white rounded-lg border ${
      pulseAnimation ? 'border-orange-500 shadow-[0_0_10px_rgba(254,205,166,0.7)]' :
      isTriggered ? 'border-orange-400 shadow-sm' : 'border-[#D9E4DD] shadow-sm'
    } p-3 w-48 transition-all duration-200`}>
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className={`w-3 h-3 bg-[#FECDA6] border-2 border-white ${
          isTriggered ? 'ring-2 ring-orange-300' : ''
        }`}
      />

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className={`w-3 h-3 bg-[#FECDA6] border-2 border-white ${
          isTriggered ? 'ring-2 ring-orange-300' : ''
        }`}
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

      {hasSourceConfigured && currentValue !== null && (
        <div className="mt-2 text-xs bg-[#FFF8F0] rounded p-1 border border-[#FECDA6]/30">
          <div className="flex justify-between items-center">
            <span className="text-[#7A8CA3]">Current:</span>
            <span className={`font-medium ${isTriggered ? 'text-orange-500' : 'text-[#5C6E91]'}`}>
              {formatValue(currentValue, sensorType)} 
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
      </div>
      
      {!hasSourceConfigured && (
        <div className="mt-2 text-xs flex items-center">
          <AlertTriangle className="h-3 w-3 text-amber-500 mr-1" />
          <span className="text-amber-500">Configure source sensor</span>
        </div>
      )}
    </div>
  )
})

TriggerNode.displayName = "TriggerNode"

