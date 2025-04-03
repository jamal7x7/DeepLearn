// lib/turtle.ts
import { TurtleStyle, DEFAULT_TURTLE_STYLE } from './turtleStyles';
import { TurtleState } from './types'; // Import TurtleState

// Helper function (can be kept outside or inside the class)
function normalizeAngle(angle: number): number {
    let normAngle = angle % 360;
    if (normAngle < 0) {
        normAngle += 360;
    }
    return normAngle;
}

// Helper function (can be kept outside or inside the class)
function degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

// Simple RGB to CSS string converter (can be kept outside or inside the class)
function rgbToCssString(r: number, g: number, b: number): string {
    const r_ = Math.max(0, Math.min(255, Math.round(r)));
    const g_ = Math.max(0, Math.min(255, Math.round(g)));
    const b_ = Math.max(0, Math.min(255, Math.round(b)));
    return `rgb(${r_}, ${g_}, ${b_})`;
}


/**
 * Represents the logical state of the Logo turtle.
 * Does not perform any drawing or animation itself.
 * Drawing is handled externally based on this state.
 */
export class Turtle implements TurtleState {
    x: number = 0;
    y: number = 0;
    angle: number = 0; // 0 degrees is UP (standard Logo)
    penDown: boolean = true;
    penColor: string = 'rgb(0, 0, 0)'; // Default black
    isVisible: boolean = true;
    style: TurtleStyle;

    constructor(initialStyle?: TurtleStyle) {
        this.style = initialStyle || DEFAULT_TURTLE_STYLE;
        this.reset(); // Initialize state via reset
    }

    // Method to update the turtle's style
    setStyle(newStyle: TurtleStyle): void {
        this.style = newStyle;
        console.log(`Turtle style set to: ${newStyle.name}`);
    }

    // Renamed from _normalizeAngle
    private normalizeAngle(angle: number): number {
        let normAngle = angle % 360;
        if (normAngle < 0) {
            normAngle += 360;
        }
        return normAngle;
    }

    // Convert Logo angle (0=up) to Canvas angle (0=right) in Radians
    // Needed only for drawing
    private getCanvasAngleRad(): number {
        // Logo angle: 0 is up, positive is clockwise
        // Canvas rotation: 0 is right, positive is clockwise
        // Canvas angle = Logo angle - 90 degrees
        return degreesToRadians(this.angle - 90);
    }

    // --- State Update Methods (Synchronous, No Drawing) ---

    home(): void {
        this.x = 0; // Assuming logical origin is 0,0
        this.y = 0;
        this.angle = 0; // Assuming home angle is 0 (UP)
        this.penDown = true; // Pen is down after home
        console.log(`State HOME. Pos: (${this.x}, ${this.y}), Angle: ${this.angle}`);
    }

    reset(): void {
        console.log("Resetting Turtle state...");
        this.x = 0;
        this.y = 0;
        this.angle = 0;
        this.penDown = true;
        this.penColor = 'rgb(0, 0, 0)'; // Reset pen color to black
        this.isVisible = true;
        this.style = DEFAULT_TURTLE_STYLE; // Reset style
    }

    // clearScreen is removed - handled by ClearAction in interpreter/animator

    setPenUp(): void {
        this.penDown = false;
        console.log("State Pen UP");
    }

    setPenDown(): void {
        this.penDown = true;
        console.log("State Pen DOWN");
    }

    right(degrees: number): void {
        const startAngle = this.angle;
        this.angle = this.normalizeAngle(startAngle + degrees);
        console.log(`State RIGHT ${degrees}. Angle: ${this.angle}`);
    }

    left(degrees: number): void {
        this.right(-degrees); // Reuse right logic
        console.log(`State LEFT ${degrees}. Angle: ${this.angle}`);
    }

    forward(distance: number): void {
        const startX = this.x;
        const startY = this.y;
        // Use Logo angle (0=UP) for calculation
        const angleRad = degreesToRadians(this.angle);
        // In Logo, 0 degrees is UP, 90 is RIGHT, 180 is DOWN, 270 is LEFT
        // For correct movement in the direction the turtle is facing:
        // When angle is 0 (UP), sin(0)=0, cos(0)=1, so turtle moves up (y increases)
        // When angle is 90 (RIGHT), sin(90)=1, cos(90)=0, so turtle moves right (x increases)
        // When angle is 180 (DOWN), sin(180)=0, cos(180)=-1, so turtle moves down (y decreases)
        // When angle is 270 (LEFT), sin(270)=-1, cos(270)=0, so turtle moves left (x decreases)
        this.x = startX + distance * Math.sin(angleRad);
        this.y = startY + distance * Math.cos(angleRad);
        console.log(`State FORWARD ${distance}. Pos: (${this.x.toFixed(2)}, ${this.y.toFixed(2)})`);
    }

    backward(distance: number): void {
        this.forward(-distance); // Reuse forward logic
        console.log(`State BACKWARD ${distance}.`);
    }

    setPenColor(r: number, g: number, b: number): void {
        const newColor = rgbToCssString(r, g, b);
        this.penColor = newColor;
        console.log(`State Set Pen Color: ${this.penColor}`);
    }

    // setBackgroundColor removed - not part of turtle state

    setHeading(targetAngleInput: number): void {
        this.angle = this.normalizeAngle(targetAngleInput);
        console.log(`State SETHEADING to ${this.angle}.`);
    }

    // Position setting methods update state directly
    // Note: These assume Logo coordinates (0,0 center, Y up)
    // Conversion to canvas coordinates happens during drawing/animation.
    setX(logoX: number): void {
        this.x = logoX;
        console.log(`State SETX to ${logoX}.`);
    }

    setY(logoY: number): void {
        this.y = logoY;
        console.log(`State SETY to ${logoY}.`);
    }

    setPos(logoX: number, logoY: number): void {
        this.x = logoX;
        this.y = logoY;
        console.log(`State SETPOS to (${logoX}, ${logoY}).`);
    }

    hideTurtle(): void {
        this.isVisible = false;
        console.log("State Hide Turtle");
    }

    showTurtle(): void {
        this.isVisible = true;
        console.log("State Show Turtle");
    }

    // Public getter for visibility
    getIsVisible(): boolean {
        return this.isVisible;
    }

    // --- Drawing Method (Requires Canvas Context) ---

    /**
     * Draws the turtle icon onto the provided canvas context based on its current state.
     * Does NOT draw path lines.
     * Assumes the context is already translated to the canvas center if needed.
     * @param ctx The CanvasRenderingContext2D to draw on.
     * @param canvasOriginX X-coordinate of the logical origin (0,0) on the canvas.
     * @param canvasOriginY Y-coordinate of the logical origin (0,0) on the canvas.
     */
    drawTurtle(ctx: CanvasRenderingContext2D, canvasOriginX: number, canvasOriginY: number): void {
        if (!this.isVisible) return;

        // Convert logical Logo coordinates (Y up) to canvas coordinates (Y down)
        const canvasX = canvasOriginX + this.x;
        const canvasY = canvasOriginY - this.y; // Invert Y

        // Calculate rotation needed for drawing (adjusts Logo angle to Canvas angle)
        const visualRotationRadians = this.getCanvasAngleRad() + Math.PI / 2;

        ctx.save();
        ctx.translate(canvasX, canvasY);
        ctx.rotate(visualRotationRadians);

        // --- Use current style ---
        const style = this.style;

        // --- Turtle Shape Properties (Simplified example) ---
        const bodyRadiusX = 9;
        const bodyRadiusY = 11;
        const headRadius = 4.5;
        const headCenterY = -(bodyRadiusY + headRadius * 0.6); // Position head in front (-Y locally)

        // --- Colors from Style ---
        const bodyColor = style.bodyColor;
        const headColor = style.headColor;
        const outlineColor = style.outlineColor;
        const penUpColorBody = style.penUpBodyColor;
        const penUpColorHead = style.penUpHeadColor;

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = outlineColor;

        // Determine fill colors based on pen state
        const currentBodyFill = this.penDown ? bodyColor : penUpColorBody;
        const currentHeadFill = this.penDown ? headColor : penUpColorHead;

        // --- Draw Simplified Turtle (Example: Oval Body + Circle Head) ---
        // (Keep the detailed drawing logic from the original if preferred)

        // Draw Body (Oval)
        ctx.beginPath();
        ctx.ellipse(0, 0, bodyRadiusX, bodyRadiusY, 0, 0, Math.PI * 2);
        ctx.fillStyle = currentBodyFill;
        ctx.fill();
        ctx.stroke();

        // Draw Head (Circle)
        ctx.beginPath();
        ctx.arc(0, headCenterY, headRadius, 0, Math.PI * 2);
        ctx.fillStyle = currentHeadFill;
        ctx.fill();
        ctx.stroke();

        // --- Restore context ---
        ctx.restore();
    }

    // Removed clearTurtle - not needed for state management
}
