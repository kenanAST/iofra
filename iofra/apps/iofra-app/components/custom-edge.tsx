import { EdgeProps, getBezierPath, Edge } from 'reactflow';
import { useMemo, useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';

export function CustomEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
  selected,
}: EdgeProps) {
  const [edgePath] = useMemo(() => {
    // Using bezier path which returns a string path
    return getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  }, [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition]);

  // State for data flow indicators
  const [dataFlowActive, setDataFlowActive] = useState(false);
  const [dataFlowIndicators, setDataFlowIndicators] = useState<{ pos: number; key: number }[]>([]);

  // Simulate data flows periodically
  useEffect(() => {
    // Every 5-10 seconds show a data flow if this isn't a device-to-trigger connection
    // (which already have animated paths)
    const isDeviceToTrigger = data?.sourceNode?.type === 'device' && data?.targetNode?.type === 'trigger';
    
    if (!isDeviceToTrigger) {
      const interval = setInterval(() => {
        if (Math.random() > 0.7) {
          // Activate data flow
          setDataFlowActive(true);
          
          // Create 3 indicators spread along the path
          const indicators = Array.from({ length: 3 }, (_, i) => ({
            pos: (i + 1) * 0.25, // positions at 25%, 50%, 75% of the path
            key: Date.now() + i
          }));
          setDataFlowIndicators(indicators);
          
          // Reset after animation completes
          setTimeout(() => {
            setDataFlowActive(false);
            setDataFlowIndicators([]);
          }, 2000);
        }
      }, Math.random() * 5000 + 5000); // Random interval between 5-10 seconds
      
      return () => clearInterval(interval);
    }
  }, [data]);

  // Find midpoint for edge controls
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  // Find source and target nodes
  const sourceNode = data?.sourceNode;
  const targetNode = data?.targetNode;
  
  // Get component name (sensor or actuator)
  const sensorName = data?.sensorName || "";
  const actuatorName = data?.actuatorName || "";
  const componentName = sensorName || actuatorName;
  const showComponentName = componentName !== "";
  const bgColor = sensorName ? "bg-[#A6D1E6]/20" : (actuatorName ? "bg-[#FFA6A6]/20" : "bg-white/80");
  const borderColor = sensorName ? "stroke-[#A6D1E6]" : (actuatorName ? "stroke-[#FFA6A6]" : "stroke-[#86A8E7]");

  const onEdgeClick = (evt: React.MouseEvent<SVGGElement, MouseEvent>, id: string) => {
    evt.stopPropagation();
    // Get the reactflow instance from data (we need to pass it in workflow-canvas)
    const reactFlowInstance = data?.reactFlowInstance;
    if (reactFlowInstance) {
      reactFlowInstance.setEdges((edges: Edge[]) => edges.filter((edge: Edge) => edge.id !== id));
    }
  };

  return (
    <>
      <path
        id={id}
        style={style}
        className={`react-flow__edge-path stroke-[#86A8E7] stroke-2 ${selected ? 'stroke-[#5C6E91]' : ''}`}
        d={edgePath}
        markerEnd={markerEnd}
      />
      
      {/* Delete button that appears when edge is selected or hovered */}
      <g 
        transform={`translate(${midX}, ${midY})`}
        onClick={(e) => onEdgeClick(e, id)}
        className="cursor-pointer opacity-0 hover:opacity-100"
        style={{ opacity: selected ? 1 : 0 }}
      >
        <circle 
          r="10" 
          className="fill-white stroke-[#ff4d4f]" 
        />
        <g transform="translate(-4, -4) scale(0.8)">
          <X className="stroke-[#ff4d4f]" />
        </g>
      </g>
      
      {/* Data flow indicators */}
      {dataFlowActive && dataFlowIndicators.map((indicator) => (
        <g key={indicator.key} className="data-flow-indicator">
          <circle
            r="4"
            className="fill-[#86C5D8]"
            style={{
              offset: `${indicator.pos * 100}%`,
              offsetPath: `path('${edgePath}')`,
            }}
          >
            <animate
              attributeName="offset-distance"
              from="0%"
              to="100%"
              dur="2s"
              begin="0s"
              fill="freeze"
            />
          </circle>
        </g>
      ))}
      
      {showComponentName && (
        <g transform={`translate(${midX}, ${midY - 20})`}>
          <rect
            x="-60"
            y="-10"
            width="120"
            height="20"
            rx="5"
            className={`fill-white/80 ${borderColor}`}
          />
          <text
            x="0"
            y="5"
            className="text-xs fill-[#5C6E91] text-center"
            dominantBaseline="middle"
            textAnchor="middle"
          >
            {componentName}
          </text>
        </g>
      )}
    </>
  );
} 