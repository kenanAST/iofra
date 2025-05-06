import { EdgeProps, getBezierPath, Edge } from 'reactflow';
import { useMemo } from 'react';
import { X } from 'lucide-react';

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