import React from 'react';
import { TurtleStyle } from '@/lib/turtleStyles';

interface TurtlePreviewProps {
  style: TurtleStyle;
  size?: number; // Optional size for the preview
}

// Renders a simplified SVG turtle preview
export const TurtlePreview: React.FC<TurtlePreviewProps> = ({
  style,
  size = 40, // Default size
}) => {
  const viewBoxSize = 24; // Internal coordinate system size
  const scale = size / viewBoxSize;

  // Simplified dimensions relative to viewBoxSize
  const bodyRadiusX = 4.5 * (viewBoxSize / 22); // Scale based on original body Y radius
  const bodyRadiusY = 5.5 * (viewBoxSize / 22);
  const headRadius = 2.2 * (viewBoxSize / 22);
  const headCenterY = -(bodyRadiusY + headRadius * 0.6);

  const flipperLength = 7 * (viewBoxSize / 22);
  const flipperWidth = 3 * (viewBoxSize / 22);
  const flipperOutwardOffset = bodyRadiusX + flipperWidth * 0.3;
  const flipperForwardOffset = bodyRadiusY * 0.1;

  const backLegLength = 3 * (viewBoxSize / 22);
  const backLegWidth = 2 * (viewBoxSize / 22);
  const backLegOutwardOffset = bodyRadiusX * 0.8;
  const backLegForwardOffset = bodyRadiusY * 0.7;

  // Use pen-down colors for preview
  const bodyFill = style.bodyColor;
  const headFill = style.headColor;
  const outline = style.outlineColor;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`-${viewBoxSize / 2} -${viewBoxSize / 2} ${viewBoxSize} ${viewBoxSize}`} // Center the viewbox
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }} // Prevent extra space below SVG
    >
      {/* Removed rotation - drawing logic should handle orientation */}
      <g>
        {/* Back Legs */}
        <rect
          x={-backLegOutwardOffset - backLegWidth / 2}
          y={backLegForwardOffset - backLegLength / 2}
          width={backLegWidth}
          height={backLegLength}
          fill={bodyFill}
          stroke={outline}
          strokeWidth="0.7"
          transform={`rotate(-135, ${-backLegOutwardOffset}, ${backLegForwardOffset})`}
        />
        <rect
          x={backLegOutwardOffset - backLegWidth / 2}
          y={backLegForwardOffset - backLegLength / 2}
          width={backLegWidth}
          height={backLegLength}
          fill={bodyFill}
          stroke={outline}
          strokeWidth="0.7"
          transform={`rotate(135, ${backLegOutwardOffset}, ${backLegForwardOffset})`}
        />

        {/* Front Flippers (Simplified as ellipses for SVG) */}
         <ellipse
          cx={-flipperOutwardOffset}
          cy={-flipperForwardOffset}
          rx={flipperWidth / 2}
          ry={flipperLength / 2}
          fill={bodyFill}
          stroke={outline}
          strokeWidth="0.7"
          transform={`rotate(-45, ${-flipperOutwardOffset}, ${-flipperForwardOffset})`}
        />
        <ellipse
          cx={flipperOutwardOffset}
          cy={-flipperForwardOffset}
          rx={flipperWidth / 2}
          ry={flipperLength / 2}
          fill={bodyFill}
          stroke={outline}
          strokeWidth="0.7"
          transform={`rotate(45, ${flipperOutwardOffset}, ${-flipperForwardOffset})`}
        />

        {/* Body */}
        <ellipse
          cx="0"
          cy="0"
          rx={bodyRadiusX}
          ry={bodyRadiusY}
          fill={bodyFill}
          stroke={outline}
          strokeWidth="0.7"
        />

        {/* Head */}
        <circle
          cx="0"
          cy={headCenterY}
          r={headRadius}
          fill={headFill}
          stroke={outline}
          strokeWidth="0.7"
        />
         {/* Tail (Simplified triangle) */}
         <polygon
            points={`0,${bodyRadiusY * 0.9} -${1.5 * (viewBoxSize / 22)},${bodyRadiusY + 2 * (viewBoxSize / 22)} ${1.5 * (viewBoxSize / 22)},${bodyRadiusY + 2 * (viewBoxSize / 22)}`}
            fill={bodyFill}
            stroke={outline}
            strokeWidth="0.7"
        />
      </g>
    </svg>
  );
};
