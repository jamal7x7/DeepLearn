'use client'; // Add this directive at the top to mark as client component

import React, { useRef, useEffect, useState } from 'react';
import { TurtleStyle, DEFAULT_TURTLE_STYLE } from '@/lib/turtleStyles';
import { LogoInterpreter } from '@/lib/logoInterpreter';
import { Turtle } from '@/lib/turtle'; // The state-only Turtle
import { TurtleAction, MoveAction, TurnAction } from '@/lib/types';

// Dynamic import for the resize observer hook to avoid SSR issues
const useResizeObserver = typeof window !== 'undefined' 
  ? require('@react-hook/resize-observer').default 
  : () => {};

// Import standard DOM ResizeObserverEntry type
type ResizeObserverEntry = globalThis.ResizeObserverEntry;

interface TurtlePreviewProps {
  code?: string;
  style?: TurtleStyle;
  isRunning?: boolean; // Made optional with internal state fallback
  requestStop?: () => void; // Made optional with internal no-op fallback
  size?: number; // For TurtleSelector's small preview
  backgroundColor?: string;
  onLog?: (log: string[]) => void;
}

// Constants for animation speed mapping
const MIN_PIXELS_PER_SECOND = 20;
const MAX_PIXELS_PER_SECOND = 400;
const MIN_DEGREES_PER_SECOND = 30;
const MAX_DEGREES_PER_SECOND = 600;

// --- Helper Functions (defined outside component) ---
const clearCanvas = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, bgColor: string) => {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
};

const drawLine = (
    ctx: CanvasRenderingContext2D,
    originX: number, originY: number,
    startX: number, startY: number, endX: number, endY: number,
    color: string, lineWidth: number = 1
) => {
    ctx.beginPath();
    ctx.moveTo(originX + startX, originY - startY); // Convert to canvas coords
    ctx.lineTo(originX + endX, originY - endY); // Convert to canvas coords
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
};

 const drawCompletedPath = (
     ctx: CanvasRenderingContext2D,
     canvas: HTMLCanvasElement,
     segments: MoveAction[]
 ) => {
     const originX = canvas.width / 2;
     const originY = canvas.height / 2;
     segments.forEach(segment => {
         if (segment.penDown) {
             drawLine(ctx, originX, originY, segment.startX, segment.startY, segment.endX, segment.endY, segment.penColor);
         }
     });
 };

function normalizeAngle(angle: number): number {
    let normAngle = angle % 360;
    if (normAngle < 0) {
        normAngle += 360;
    }
    return normAngle;
}
// --- End Helper Functions ---


export const TurtlePreview: React.FC<TurtlePreviewProps> = ({
  code = '',
  style = DEFAULT_TURTLE_STYLE,
  isRunning: externalIsRunning,
  requestStop = () => {}, // Default no-op function
  size,
  backgroundColor = '#222222',
  onLog,
}) => {
  // Internal running state if not controlled externally
  const [internalIsRunning, setInternalIsRunning] = useState<boolean>(false);
  // Use external state if provided, otherwise use internal state
  const isRunning = externalIsRunning !== undefined ? externalIsRunning : internalIsRunning;
  
  // If size is provided (for TurtleSelector), use a simplified rendering
  if (size !== undefined) {
    return (
      <div style={{ width: size, height: size, position: 'relative' }}>
        <svg width={size} height={size} viewBox="-10 -10 20 20">
          {/* Simple turtle icon based on style */}
          <polygon 
            points="0,-5 -3,3 0,1 3,3" 
            fill={style.color || '#00FF00'} 
            stroke="#000000" 
            strokeWidth="0.5"
          />
        </svg>
      </div>
    );
  }
  const containerRef = useRef<HTMLDivElement>(null); // Ref for the container div
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const interpreterRef = useRef<LogoInterpreter | null>(null);
  const turtleRef = useRef<Turtle | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const [actions, setActions] = useState<TurtleAction[]>([]);
  const [currentActionIndex, setCurrentActionIndex] = useState<number>(0);
  const [animationStartTime, setAnimationStartTime] = useState<number | null>(null);
  const [currentTurtleState, setCurrentTurtleState] = useState<Turtle | null>(null);
  const [drawnPathSegments, setDrawnPathSegments] = useState<MoveAction[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 }); // State for canvas dimensions

  // Initialize Interpreter and Turtle State (runs once)
  useEffect(() => {
    interpreterRef.current = new LogoInterpreter();
    // Initialize the stateful Turtle instance used for drawing the icon
    turtleRef.current = new Turtle(style);
    setCurrentTurtleState(new Turtle(style)); // Initialize state for drawing
    setDrawnPathSegments([]); // Clear path on init
  }, []); // Run once on mount

  // Update Turtle Style when prop changes
  useEffect(() => {
    if (turtleRef.current) {
      turtleRef.current.setStyle(style);
    }
    if (currentTurtleState) {
      // Create a new instance to trigger redraw if needed, copying state
      const newState = new Turtle(style);
      newState.x = currentTurtleState.x;
      newState.y = currentTurtleState.y;
      newState.angle = currentTurtleState.angle;
      newState.penDown = currentTurtleState.penDown;
      newState.penColor = currentTurtleState.penColor;
      newState.isVisible = currentTurtleState.isVisible;
      setCurrentTurtleState(newState);
      
      // Immediately redraw the canvas with the new style
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) {
        clearCanvas(ctx, canvas, backgroundColor);
        drawCompletedPath(ctx, canvas, drawnPathSegments);
        newState.drawTurtle(ctx, canvas.width / 2, canvas.height / 2);
      }
    }
  }, [style, backgroundColor]); // Removed drawnPathSegments from dependencies to fix style selection

  // Effect to handle canvas resizing - Only run in browser environment
  useEffect(() => {
    // Skip if not in browser environment
    if (typeof window === 'undefined') return;
    
    // Initialize canvas size on mount
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0 && (width !== canvasSize.width || height !== canvasSize.height)) {
          setCanvasSize({ width, height });
          // Redraw static elements on resize
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (ctx && canvas && currentTurtleState) {
            canvas.width = width;
            canvas.height = height;
            clearCanvas(ctx, canvas, backgroundColor);
            drawCompletedPath(ctx, canvas, drawnPathSegments);
            currentTurtleState.drawTurtle(ctx, width / 2, height / 2);
          }
        }
      }
    };
    
    // Initial size update
    updateCanvasSize();
    
    // Set up resize observer if available
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      const resizeObserver = new ResizeObserver(updateCanvasSize);
      resizeObserver.observe(containerRef.current);
      return () => {
        if (containerRef.current) {
          resizeObserver.unobserve(containerRef.current);
        }
      };
    }
  }, [backgroundColor, canvasSize, currentTurtleState, drawnPathSegments]);


  // Run Interpreter only when isRunning becomes true and we have code
  useEffect(() => {
    // Skip execution if no code or if this is just a display preview
    if (size !== undefined || !code) return;
    
    if (isRunning && interpreterRef.current) {
      console.log('Execution requested: Running interpreter...');
      // Ensure any previous animation is stopped
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      setCurrentActionIndex(0);
      setAnimationStartTime(null);
      setDrawnPathSegments([]); // Clear previous path

      interpreterRef.current.execute(code).then((newActions) => {
        console.log(`Interpreter finished, ${newActions.length} actions generated.`);
        setActions(newActions);
        // Reset the visual turtle state to initial for the new animation run
        const initialTurtle = new Turtle(style);
        turtleRef.current = initialTurtle;
        setCurrentTurtleState(initialTurtle);
        // Start animation if actions exist
        if (newActions.length > 0) {
          setAnimationStartTime(performance.now()); // Trigger animation loop
        } else {
            // No actions, signal completion immediately
            requestStop();
        }
        if (onLog) {
          onLog(interpreterRef.current?.getLog() || []);
        }
      }).catch(error => {
         console.error("Error during interpreter execution:", error);
         if (onLog) {
           onLog(interpreterRef.current?.getLog() || [`EXECUTION FAILED: ${error.message}`]);
         }
         requestStop(); // Signal stop on error
      });
    } else if (!isRunning) {
        // If isRunning becomes false, stop any ongoing animation
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
            console.log("Animation stopped externally.");
            // Optionally reset state or leave it as is
             // Let's reset to the beginning state when stopped externally
             setActions([]);
             setCurrentActionIndex(0);
             setAnimationStartTime(null);
             setDrawnPathSegments([]);
             const initialTurtle = new Turtle(style);
             turtleRef.current = initialTurtle;
             setCurrentTurtleState(initialTurtle);
             // Redraw in initial state
             const canvas = canvasRef.current;
             const ctx = canvas?.getContext('2d');
             if (ctx && canvas) {
                 clearCanvas(ctx, canvas, backgroundColor);
                 initialTurtle.drawTurtle(ctx, canvas.width / 2, canvas.height / 2);
             }
        }
    }
  }, [isRunning, code, style, onLog, requestStop]); // Dependencies for starting/stopping execution


  // Animation Loop - triggered by animationStartTime change
  useEffect(() => {
    // Only run animation if start time is set (meaning execution is active and actions exist)
    if (animationStartTime === null) {
        // Ensure canvas is cleared and shows current static state if animation isn't running
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
         if (ctx && canvas && currentTurtleState) {
             clearCanvas(ctx, canvas, backgroundColor);
             drawCompletedPath(ctx, canvas, drawnPathSegments);
             currentTurtleState.drawTurtle(ctx, canvasSize.width / 2, canvasSize.height / 2);
         }
        return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    // Additional check: ensure canvas dimensions are set
    if (!ctx || !canvas || canvasSize.width === 0 || canvasSize.height === 0 || actions.length === 0 || currentActionIndex >= actions.length) {
      return; // Stop if context/canvas/size invalid or animation finished
    }

    const originX = canvasSize.width / 2;
    const originY = canvasSize.height / 2;
    const currentAction = actions[currentActionIndex];
    const speed = style.speed; // Get speed from current style

    // --- Calculate Duration based on Speed ---
    let duration = 0;
    if (currentAction.type === 'move') {
        const pps = MIN_PIXELS_PER_SECOND + (MAX_PIXELS_PER_SECOND - MIN_PIXELS_PER_SECOND) * (speed - 1) / 9;
        duration = pps > 0 ? (Math.abs((currentAction as MoveAction).distance) / pps) * 1000 : 0;
    } else if (currentAction.type === 'turn') {
        const dps = MIN_DEGREES_PER_SECOND + (MAX_DEGREES_PER_SECOND - MIN_DEGREES_PER_SECOND) * (speed - 1) / 9;
        duration = dps > 0 ? (Math.abs((currentAction as TurnAction).degrees) / dps) * 1000 : 0;
    } else if (currentAction.type === 'wait') {
        duration = currentAction.duration;
    }
    // Instant actions have duration 0

    const animate = (currentTime: number) => {
      const elapsedTime = currentTime - animationStartTime;
      const progress = duration > 0 ? Math.min(elapsedTime / duration, 1) : 1;

      // Ensure turtleRef.current exists
      if (!turtleRef.current) return;

      // Create a temporary state for drawing the current frame
      let frameTurtleState = new Turtle(turtleRef.current.style);
      frameTurtleState.x = turtleRef.current.x;
      frameTurtleState.y = turtleRef.current.y;
      frameTurtleState.angle = turtleRef.current.angle;
      frameTurtleState.penDown = turtleRef.current.penDown;
      frameTurtleState.penColor = turtleRef.current.penColor;
      frameTurtleState.isVisible = turtleRef.current.isVisible;


      // --- Update state based on current action and progress ---
      let currentSegment: MoveAction | null = null; // For drawing the in-progress line

      switch (currentAction.type) {
        case 'move':
          const moveAction = currentAction as MoveAction;
          const interpX = moveAction.startX + (moveAction.endX - moveAction.startX) * progress;
          const interpY = moveAction.startY + (moveAction.endY - moveAction.startY) * progress;
          frameTurtleState.x = interpX;
          frameTurtleState.y = interpY;
          // Define the segment being drawn in this frame
          currentSegment = { ...moveAction, endX: interpX, endY: interpY };
          break;
        case 'turn':
          const turnAction = currentAction as TurnAction;
          // Ensure shortest path interpolation
          let angleDiff = turnAction.degrees;
          // No need for complex wrapping logic here if degrees is correct
          frameTurtleState.angle = normalizeAngle(turnAction.startAngle + angleDiff * progress);
          break;
        // Instant actions are handled when progress reaches 1
      }

      // --- Drawing ---
      clearCanvas(ctx, canvas, backgroundColor);
      drawCompletedPath(ctx, canvas, drawnPathSegments);

      // Draw the current animating segment if it's a move and pen is down
      if (currentSegment && currentSegment.penDown) {
          drawLine(ctx, originX, originY, currentSegment.startX, currentSegment.startY, currentSegment.endX, currentSegment.endY, currentSegment.penColor);
      }

      // Draw the turtle icon at the interpolated/current position
      frameTurtleState.drawTurtle(ctx, originX, originY);
      setCurrentTurtleState(frameTurtleState); // Update state for next potential static draw

      // --- Progress to next action? ---
      if (progress >= 1) {
        // Apply final state of the completed action to the main turtle state
        switch (currentAction.type) {
            case 'move':
                turtleRef.current.x = currentAction.endX;
                turtleRef.current.y = currentAction.endY;
                // Add completed segment to path history if pen was down
                if (currentAction.penDown) {
                    setDrawnPathSegments(prev => [...prev, currentAction]);
                }
                break;
            case 'turn':
                turtleRef.current.angle = currentAction.endAngle;
                break;
            case 'pen':
                turtleRef.current.penDown = currentAction.penDown;
                break;
            case 'color':
                turtleRef.current.penColor = currentAction.color;
                break;
            case 'clear':
                setDrawnPathSegments([]); // Clear path history
                // State reset is handled by the 'home' action often following clear
                break;
            case 'home':
                // Home action implies move and turn, state updated by those if generated by interpreter
                // If interpreter generates a specific 'home' action, apply final state here:
                turtleRef.current.home(); // Apply final home state
                // If home implies clear, handle path clearing here or ensure interpreter sends 'clear'
                // setDrawnPathSegments([]);
                break;
            case 'visibility':
                turtleRef.current.isVisible = currentAction.isVisible;
                break;
            case 'wait':
                // No state change, just waited
                break;
        }

        // Move to the next action
        const nextIndex = currentActionIndex + 1;
        if (nextIndex < actions.length) {
          setCurrentActionIndex(nextIndex);
          setAnimationStartTime(currentTime); // Start time for the next action
          animationFrameId.current = requestAnimationFrame(animate); // Continue animation
        } else {
          // Animation finished
          setCurrentActionIndex(nextIndex);
          setAnimationStartTime(null); // Stop animation loop
          animationFrameId.current = null;
          console.log("Animation sequence complete.");
          // Final draw in the exact end state
          clearCanvas(ctx, canvas, backgroundColor);
          drawCompletedPath(ctx, canvas, drawnPathSegments);
          if (turtleRef.current) { // Check ref exists
            turtleRef.current.drawTurtle(ctx, originX, originY);
            setCurrentTurtleState(turtleRef.current); // Ensure final state is rendered
          }
          requestStop(); // Signal to parent that execution finished
        }
      } else {
        // Continue current action animation
        animationFrameId.current = requestAnimationFrame(animate);
      }
    };

    // Start the animation loop
    animationFrameId.current = requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [actions, currentActionIndex, animationStartTime, style, backgroundColor, drawnPathSegments, canvasSize, requestStop]);

  // --- Drawing Helper Functions are now defined outside ---

  // --- Render Canvas ---
  // Wrap canvas in a div to observe size
  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden">
        <canvas
            ref={canvasRef}
            width={canvasSize.width} // Set canvas size from state
            height={canvasSize.height}
            style={{ display: 'block' }} // Prevent extra space below canvas
            // Removed border style, parent card handles it
        />
    </div>
  );
}; // End of TurtlePreview component
