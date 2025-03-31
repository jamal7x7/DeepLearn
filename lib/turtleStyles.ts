export interface TurtleStyle {
    name: string;
    // Function to draw the turtle shape centered at (0,0) facing upwards (angle 0).
    // The Turtle class will handle translation and rotation.
    // scale can be used to adjust size relative to a default (e.g., 10px radius).
    draw: (ctx: CanvasRenderingContext2D, color: string, scale?: number) => void;
}

// --- Define Drawing Functions ---

const drawClassicTriangle: TurtleStyle['draw'] = (ctx, color, scale = 1) => {
    const size = 10 * scale;
    ctx.beginPath();
    ctx.moveTo(0, -size);      // Tip
    ctx.lineTo(size * 0.5, size * 0.5); // Bottom right
    ctx.lineTo(-size * 0.5, size * 0.5); // Bottom left
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; // White outline
    ctx.lineWidth = 1 * scale;
    ctx.stroke();
};

const drawArrow: TurtleStyle['draw'] = (ctx, color, scale = 1) => {
    const size = 12 * scale;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.8); // Tip
    ctx.lineTo(size * 0.4, size * 0.2); // Wing right
    ctx.lineTo(size * 0.15, size * 0.2);
    ctx.lineTo(size * 0.15, size * 0.6); // Body right
    ctx.lineTo(-size * 0.15, size * 0.6); // Body left
    ctx.lineTo(-size * 0.15, size * 0.2);
    ctx.lineTo(-size * 0.4, size * 0.2); // Wing left
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
};

const drawCircle: TurtleStyle['draw'] = (ctx, color, scale = 1) => {
    const radius = 6 * scale;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2); // Circle centered at origin
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    // Add a small line indicating direction
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -radius * 1.2); // Line pointing 'up'
    ctx.strokeStyle = color; // Use same color or a contrast
    ctx.lineWidth = 2 * scale;
    ctx.stroke();
};

const drawSquare: TurtleStyle['draw'] = (ctx, color, scale = 1) => {
    const size = 10 * scale;
    ctx.beginPath();
    ctx.rect(-size / 2, -size / 2, size, size); // Centered square
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
     // Add a small line indicating direction
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -size * 0.6); // Line pointing 'up'
    ctx.strokeStyle = '#FFFFFF'; // White contrast
    ctx.lineWidth = 2 * scale;
    ctx.stroke();
};

const drawTurtleShape: TurtleStyle['draw'] = (ctx, color, scale = 1) => {
    const size = 10 * scale;
    // Body (ellipse)
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.6, size, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    // Head (circle)
    ctx.beginPath();
    ctx.arc(0, -size * 1.1, size * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    // Legs (simple lines for now)
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 * scale;
    ctx.beginPath(); ctx.moveTo(-size*0.6, -size*0.5); ctx.lineTo(-size*0.9, -size*0.3); ctx.stroke(); // L F
    ctx.beginPath(); ctx.moveTo( size*0.6, -size*0.5); ctx.lineTo( size*0.9, -size*0.3); ctx.stroke(); // R F
    ctx.beginPath(); ctx.moveTo(-size*0.6,  size*0.5); ctx.lineTo(-size*0.9,  size*0.7); ctx.stroke(); // L B
    ctx.beginPath(); ctx.moveTo( size*0.6,  size*0.5); ctx.lineTo( size*0.9,  size*0.7); ctx.stroke(); // R B
};


// --- Define Styles Array ---

export const TURTLE_STYLES: TurtleStyle[] = [
    { name: "Classic", draw: drawClassicTriangle },
    { name: "Arrow", draw: drawArrow },
    { name: "Circle", draw: drawCircle },
    { name: "Square", draw: drawSquare },
    { name: "Turtle", draw: drawTurtleShape },
    // Add a 6th style - maybe just a different color triangle?
    { name: "Red Classic", draw: drawClassicTriangle } // Same shape, color handled separately
];

// You might want separate colors, or handle color in the draw function,
// or pass the color when calling draw. Let's pass the color.
export const TURTLE_COLORS: { [key: string]: string } = {
    "Classic": "#A0A0A0", // Gray
    "Arrow": "#4682B4",   // Steel Blue
    "Circle": "#32CD32",  // Lime Green
    "Square": "#FF8C00",  // Dark Orange
    "Turtle": "#8FBC8F",  // Dark Sea Green
    "Red Classic": "#DC143C" // Crimson Red
};

// Default style
export const DEFAULT_TURTLE_STYLE = TURTLE_STYLES[0]; 