import { EdgeProps, getBezierPath } from 'reactflow';
import { useMemo } from 'react';

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

  // Find source and target nodes
  const sourceNode = data?.sourceNode;
  const targetNode = data?.targetNode;
  
  const sensorName = data?.sensorName || "";
  const showSensorName = sensorName !== "";

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path stroke-[#86A8E7] stroke-2"
        d={edgePath}
        markerEnd={markerEnd}
      />
      
      {showSensorName && (
        <g transform={`translate(${(sourceX + targetX) / 2}, ${(sourceY + targetY) / 2})`}>
          <rect
            x="-50"
            y="-10"
            width="100"
            height="20"
            rx="5"
            className="fill-white/80 stroke-[#86A8E7]"
          />
          <text
            x="0"
            y="5"
            className="text-xs fill-[#5C6E91] text-center"
            dominantBaseline="middle"
            textAnchor="middle"
          >
            {sensorName}
          </text>
        </g>
      )}
    </>
  );
} 