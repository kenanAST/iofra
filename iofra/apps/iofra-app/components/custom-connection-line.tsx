import { ConnectionLineComponentProps, getBezierPath, Position } from 'reactflow';
import { useMemo } from 'react';

export function CustomConnectionLine({ fromX, fromY, toX, toY, fromPosition }: ConnectionLineComponentProps) {
  const [edgePath] = useMemo(() => {
    // Using bezier path to avoid type issues with smoothstep
    return getBezierPath({
      sourceX: fromX,
      sourceY: fromY,
      sourcePosition: fromPosition,
      targetX: toX,
      targetY: toY,
      targetPosition: fromPosition === Position.Left ? Position.Right : Position.Left,
    });
  }, [fromX, fromY, toX, toY, fromPosition]);

  return (
    <g>
      <path
        style={{ strokeWidth: 2 }}
        className="animated stroke-[#86A8E7] fill-none"
        d={edgePath}
      />
    </g>
  );
} 