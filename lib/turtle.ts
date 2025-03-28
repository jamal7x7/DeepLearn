// lib/turtle.ts

export class Turtle {
    x: number;
    y: number;
    angle: number; // Degrees, 0 is UP, positive is clockwise
    isPenDown: boolean;
    color: string;
    private ctx: CanvasRenderingContext2D;
    private canvasWidth: number;
    private canvasHeight: number;

    constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
        this.ctx = ctx;
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.home(); // Initialize state
    }

    // Reset turtle to center, facing up, pen down
    home(): void {
        this.x = this.canvasWidth / 2;
        this.y = this.canvasHeight / 2;
        this.angle = 0;
        this.isPenDown = true;
        this.color = '#000000'; // Default black
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath(); // Reset path state
        this.ctx.moveTo(this.x, this.y);
        console.log(`Turtle HOME: (${this.x.toFixed(2)}, ${this.y.toFixed(2)}), Angle: ${this.angle}`);
    }

    // Clear the canvas and reset the turtle
    clearScreen(): void {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.home();
        console.log("Canvas Cleared (CS)");
    }

    penUp(): void {
        this.isPenDown = false;
        console.log("Pen UP (PU)");
    }

    penDown(): void {
        this.isPenDown = true;
        this.ctx.moveTo(this.x, this.y); // Start new path segment from current pos
        console.log("Pen DOWN (PD)");
    }

    // Turn right by 'degrees'
    right(degrees: number): void {
        this.angle = (this.angle + degrees) % 360;
        console.log(`Turn RIGHT ${degrees}. New Angle: ${this.angle}`);
    }

    // Turn left by 'degrees'
    left(degrees: number): void {
        this.angle = (this.angle - degrees) % 360;
        if (this.angle < 0) {
            this.angle += 360; // Keep angle positive
        }
        console.log(`Turn LEFT ${degrees}. New Angle: ${this.angle}`);
    }

    // Move forward by 'distance'
    forward(distance: number): void {
        const angleRad = (this.angle - 90) * (Math.PI / 180); // Convert Logo angle (0=up) to Canvas angle (0=right)
        const startX = this.x;
        const startY = this.y;
        this.x += distance * Math.cos(angleRad);
        this.y += distance * Math.sin(angleRad);

        console.log(`Move FORWARD ${distance}. New Pos: (${this.x.toFixed(2)}, ${this.y.toFixed(2)})`);

        if (this.isPenDown) {
            this.ctx.lineTo(this.x, this.y);
            this.ctx.stroke(); // Draw the line segment immediately
            // Start next potential line from the new point
            this.ctx.beginPath();
            this.ctx.moveTo(this.x, this.y);
        } else {
            this.ctx.moveTo(this.x, this.y); // Move the drawing cursor without drawing
        }
    }

    // Move backward by 'distance'
    backward(distance: number): void {
        this.forward(-distance); // Backward is just negative forward
        console.log(`Move BACKWARD ${distance}`); // Log adjusted in forward
    }

     // Basic Set Pen Color (Example - you could extend this)
     setPenColor(r: number, g: number, b: number): void {
        const color = `rgb(${Math.max(0, Math.min(255, r|0))}, ${Math.max(0, Math.min(255, g|0))}, ${Math.max(0, Math.min(255, b|0))})`;
        this.color = color;
        this.ctx.strokeStyle = this.color;
        console.log(`Set Pen Color: ${this.color}`);
    }

    // Placeholder for drawing the turtle icon itself (optional)
    drawTurtle(): void {
        // Save current state
        this.ctx.save();

        // Translate and rotate context to turtle's position and angle
        this.ctx.translate(this.x, this.y);
        this.ctx.rotate((this.angle - 90) * Math.PI / 180); // Align with turtle's heading

        // Draw a simple triangle
        this.ctx.beginPath();
        this.ctx.moveTo(0, -8); // Point
        this.ctx.lineTo(5, 5);  // Bottom right
        this.ctx.lineTo(-5, 5); // Bottom left
        this.ctx.closePath();
        this.ctx.fillStyle = this.isPenDown ? this.color : 'grey';
        this.ctx.fill();

        // Restore context state
        this.ctx.restore();
    }
}