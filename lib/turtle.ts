// lib/turtle.ts
import { TurtleStyle, DEFAULT_TURTLE_STYLE } from './turtleStyles'; // Import styles

export class Turtle {
    x: number = 0; // Initializer
    y: number = 0; // Initializer
    angle: number = 0; // Degrees, 0 is UP, positive is clockwise - Initializer (Reverted)
    isPenDown: boolean = true; // Initializer
    color: string = '#000000'; // Initializer for pen color
    private backgroundColor: string; // No default here, set in constructor
    private canvasWidth: number;
    private canvasHeight: number;
    private onBgChange: ((color: string) => void) | null = null; // Callback for bg change
    private isVisible: boolean = true; // Added visibility flag
    private style: TurtleStyle; // Add style property

    constructor(
        private ctx: CanvasRenderingContext2D,
        private width: number,
        private height: number,
        initialBackgroundColor: string, // Receive initial color
        onBgChange?: (color: string) => void, // Optional callback
        initialStyle?: TurtleStyle // Optional initial style
    ) {
        this.ctx = ctx;
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.backgroundColor = initialBackgroundColor || 'rgb(0,0,0)';
        this.onBgChange = onBgChange || null; // Store the callback
        this.style = initialStyle || DEFAULT_TURTLE_STYLE; // Set initial style
        this.isVisible = true; // Ensure visible initially
        this.home();
        this.penDown();
        this.setPenColor(255, 255, 255); // Default pen color to white
        // No need to call clearScreen here usually, let initial render handle it or call externally
    }

    // Method to update the turtle's style
    setStyle(newStyle: TurtleStyle): void {
        this.style = newStyle;
        // Optionally redraw the turtle immediately if visible
        if (this.isVisible) {
            // Need a way to trigger redraw from the outside, or handle it here
            // For now, just update the style. The next draw cycle will use it.
            console.log(`Turtle style set to: ${newStyle.name}`);
        }
    }

    private _normalizeAngle(angle: number): number {
        let normAngle = angle % 360;
        if (normAngle < 0) {
            normAngle += 360;
        }
        return normAngle;
    }

    // Convert Logo angle (0=up) to Canvas angle (0=right) in Radians
    private _getCanvasAngleRad(): number {
         // Adjust angle so 0 is UP, then convert degrees to radians
         // Canvas rotation: 0 is right, positive is clockwise
         // Logo angle: 0 is up, positive is clockwise
         // Canvas angle = Logo angle - 90 degrees (Reverted)
        return (this.angle - 90) * (Math.PI / 180);
    }

    home(): void {
        this.x = this.canvasWidth / 2;
        this.y = this.canvasHeight / 2;
        this.angle = 0; // Reverted default angle to 0 (UP)
        this.isPenDown = true;
        this.color = '#000000'; // Reset pen color too? Or keep current? Keeping current for now.
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath(); // Reset path state
        this.ctx.moveTo(this.x, this.y);
        console.log(`Turtle HOME: (${this.x.toFixed(2)}, ${this.y.toFixed(2)}), Angle: ${this.angle}`);
    }

    // Add reset method
    reset(): void {
        console.log("Resetting Turtle state and clearing screen...");
        this.clearScreen();
        this.style = DEFAULT_TURTLE_STYLE; // Reset style on full reset
    }

    clearScreen(): void {
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.home(); // Reset position after clearing
        // Notify about background color potentially being applied
        this.onBgChange?.(this.backgroundColor);
    }

    penUp(): void {
        this.isPenDown = false;
        console.log("Pen UP (PU/LC)");
    }

    penDown(): void {
        this.isPenDown = true;
        this.ctx.moveTo(this.x, this.y); // Start new path segment from current pos
        console.log("Pen DOWN (PD/BC)");
    }

    // Public getter for visibility
    getIsVisible(): boolean {
        return this.isVisible;
    }

    getBackgroundColor(): string {
        return this.backgroundColor;
    }

    right(degrees: number): void {
        this.angle = this._normalizeAngle(this.angle + degrees);
        console.log(`Turn RIGHT ${degrees}. New Angle: ${this.angle}`);
    }

    left(degrees: number): void {
        this.angle = this._normalizeAngle(this.angle - degrees);
        console.log(`Turn LEFT ${degrees}. New Angle: ${this.angle}`);
    }

    forward(distance: number): void {
        const angleRad = this._getCanvasAngleRad();
        const startX = this.x;
        const startY = this.y;
        this.x += distance * Math.cos(angleRad);
        this.y += distance * Math.sin(angleRad);

        // console.log(`Move FORWARD ${distance}. New Pos: (${this.x.toFixed(2)}, ${this.y.toFixed(2)})`);

        if (this.isPenDown) {
            this.ctx.lineTo(this.x, this.y);
            this.ctx.stroke();
            this.ctx.beginPath(); // Necessary for stroke() to work segment by segment
            this.ctx.moveTo(this.x, this.y);
        } else {
            this.ctx.moveTo(this.x, this.y);
        }
    }

    backward(distance: number): void {
        this.forward(-distance); // Reuses forward logic
        // console.log(`Move BACKWARD ${distance}`); // Logged correctly by forward
    }

    setPenColor(r: number, g: number, b: number): void {
        const nr = Math.max(0, Math.min(255, Math.round(r)));
        const ng = Math.max(0, Math.min(255, Math.round(g)));
        const nb = Math.max(0, Math.min(255, Math.round(b)));
        const color = `rgb(${nr}, ${ng}, ${nb})`;
        this.color = color;
        this.ctx.strokeStyle = this.color;
        // Reset path to apply new color immediately if pen is down
        if (this.isPenDown) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.x, this.y);
        }
        console.log(`Set Pen Color (SETPC/FCC): ${this.color}`);
    }

    setBackgroundColor(r: number, g: number, b: number): void {
        r = Math.max(0, Math.min(255, Math.round(r)));
        g = Math.max(0, Math.min(255, Math.round(g)));
        b = Math.max(0, Math.min(255, Math.round(b)));
        const newColor = `rgb(${r},${g},${b})`;
        if (newColor !== this.backgroundColor) { // Only update if color actually changed
            this.backgroundColor = newColor;
            // Apply immediately
            this.ctx.fillStyle = this.backgroundColor;
            this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
            // Notify about the change
            this.onBgChange?.(this.backgroundColor);
        }
    }

    setHeading(angle: number): void {
        this.angle = this._normalizeAngle(angle);
        console.log(`Set Heading (SETH/FC): ${this.angle}`);
    }

    setX(x: number): void {
        const newX = this.canvasWidth / 2 + x; // Assume Logo 0,0 is center
        // console.log(`Set X: From ${this.x.toFixed(2)} to ${newX.toFixed(2)} (Logo X: ${x})`);
        if (this.isPenDown) {
            this.ctx.lineTo(newX, this.y);
            this.ctx.stroke();
            this.ctx.beginPath();
        }
        this.x = newX;
        this.ctx.moveTo(this.x, this.y);
    }

    setY(y: number): void {
        const newY = this.canvasHeight / 2 - y; // Assume Logo Y increases upwards, Canvas Y downwards
        // console.log(`Set Y: From ${this.y.toFixed(2)} to ${newY.toFixed(2)} (Logo Y: ${y})`);
        if (this.isPenDown) {
            this.ctx.lineTo(this.x, newY);
            this.ctx.stroke();
            this.ctx.beginPath();
        }
        this.y = newY;
        this.ctx.moveTo(this.x, this.y);
    }

    setPos(x: number, y: number): void {
        const newX = this.canvasWidth / 2 + x;
        const newY = this.canvasHeight / 2 - y;
        // console.log(`Set Pos: To (${newX.toFixed(2)}, ${newY.toFixed(2)}) (Logo Pos: ${x}, ${y})`);
        if (this.isPenDown) {
            this.ctx.lineTo(newX, newY);
            this.ctx.stroke();
            this.ctx.beginPath();
        }
        this.x = newX;
        this.y = newY;
        this.ctx.moveTo(this.x, this.y);
    }

    drawTurtle(): void {
        if (!this.isVisible) return; // Don't draw if hidden

        const ctx = this.ctx;
        const currentAngle = this.angle; // Get angle value
        // Calculate base rotation for movement/logic (0=UP -> -PI/2 canvas)
        const logicRotationRadians = this._getCanvasAngleRad();
        // Adjust rotation for drawing: align turtle's drawn UP (-Y local) with the logical direction.
        // Requires adding 90 degrees (PI/2 radians) to the logic rotation.
        const visualRotationRadians = logicRotationRadians + Math.PI / 2;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(visualRotationRadians); // Use the visually corrected rotation

        // --- Use current style ---
        const style = this.style;

        // --- Sea Turtle Properties (Could be adjusted based on style later) ---
        const bodyRadiusX = 9;
        const bodyRadiusY = 11;
        const headRadius = 4.5;
        const headCenterY = -(bodyRadiusY + headRadius * 0.6);

        const flipperLength = 14;
        const flipperWidth = 6;
        const flipperOutwardOffset = bodyRadiusX + flipperWidth * 0.3;
        const flipperForwardOffset = bodyRadiusY * 0.1;

        const backLegLength = 6;
        const backLegWidth = 4;
        const backLegOutwardOffset = bodyRadiusX * 0.8;
        const backLegForwardOffset = bodyRadiusY * 0.7;

        // --- Colors from Style ---
        const bodyColor = style.bodyColor;
        const headColor = style.headColor;
        const outlineColor = style.outlineColor;
        const penUpColorBody = style.penUpBodyColor;
        const penUpColorHead = style.penUpHeadColor;

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = outlineColor;

        // Determine fill colors based on pen state and style
        const currentBodyFill = this.isPenDown ? bodyColor : penUpColorBody;
        const currentHeadFill = this.isPenDown ? headColor : penUpColorHead;

        // --- Draw Legs/Flippers ---
        ctx.fillStyle = currentBodyFill; // Use body color for legs

        // Helper function to draw a rounded rectangle (flipper shape)
        const drawFlipper = (x: number, y: number, width: number, height: number, angleDeg: number) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angleDeg * Math.PI / 180);
            ctx.beginPath();
            ctx.moveTo(-width / 2, -height / 2 + width / 2);
            ctx.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + width / 2, -height / 2);
            ctx.lineTo(width / 2 - width / 2, -height / 2);
            ctx.quadraticCurveTo(width / 2, -height / 2, width / 2, -height / 2 + width / 2);
            ctx.lineTo(width / 2, height / 2 - width / 2);
            ctx.quadraticCurveTo(width / 2, height / 2, width / 2 - width / 2, height / 2);
            ctx.lineTo(-width / 2 + width / 2, height / 2);
            ctx.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - width / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        };

         // Helper function to draw a simple rectangle leg
         const drawBackLeg = (x: number, y: number, width: number, height: number, angleDeg: number) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angleDeg * Math.PI / 180);
            ctx.fillRect(-width / 2, -height / 2, width, height);
            ctx.strokeRect(-width / 2, -height / 2, width, height);
            ctx.restore();
        };

        // Front-left Flipper
        drawFlipper(-flipperOutwardOffset, -flipperForwardOffset, flipperWidth, flipperLength, -45);
        // Front-right Flipper
        drawFlipper( flipperOutwardOffset, -flipperForwardOffset, flipperWidth, flipperLength, 45);
        // Back-left Leg
        drawBackLeg(-backLegOutwardOffset, backLegForwardOffset, backLegWidth, backLegLength, -135);
        // Back-right Leg
        drawBackLeg( backLegOutwardOffset, backLegForwardOffset, backLegWidth, backLegLength, 135);

        // --- Draw Body (Oval - Drawn after legs) ---
        ctx.beginPath();
        ctx.ellipse(0, 0, bodyRadiusX, bodyRadiusY, 0, 0, Math.PI * 2);
        ctx.fillStyle = currentBodyFill;
        ctx.fill();
        ctx.stroke();

        // --- Draw Head (Circle - Positioned forward) ---
        ctx.beginPath();
        ctx.arc(0, headCenterY, headRadius, 0, Math.PI * 2);
        ctx.fillStyle = currentHeadFill;
        ctx.fill();
        ctx.stroke();

        // --- Draw Tail (Shorter, stubbier triangle) ---
        ctx.beginPath();
        const tailBaseY = bodyRadiusY * 0.9;
        const tailTipY = bodyRadiusY + 4;
        const tailWidth = 5;
        ctx.moveTo(0, tailBaseY);
        ctx.lineTo(-tailWidth / 2, tailTipY);
        ctx.lineTo( tailWidth / 2, tailTipY);
        ctx.closePath();
        ctx.fillStyle = currentBodyFill; // Match body
        ctx.fill();
        ctx.stroke();

        ctx.restore(); // Restore original canvas state
    }

    // Helper to erase the turtle shape by drawing background color over it
    private clearTurtle() {
        // This needs to erase the *current* shape accurately.
        // For simplicity, let's just clear a bounding box slightly larger than the turtle.
        // A more precise method would redraw the turtle shape with the background color.
        // Use fixed estimated dimensions for clearing, independent of style properties
        const estimatedMaxDimension = 14; // Based on flipperLength being the largest visual part
        const size = estimatedMaxDimension * 2.5; // Estimate clearing size
        const angleRad = this._getCanvasAngleRad();

        this.ctx.save();
        this.ctx.translate(this.x, this.y);
        this.ctx.rotate(angleRad);
        // Clear a rectangle centered around the turtle's rotated position
        this.ctx.fillStyle = this.backgroundColor;
        // Adjust clearing area based on turtle dimensions if needed
        this.ctx.fillRect(-size / 2, -size / 2, size, size);
        this.ctx.restore();
    }

    // Added HT/ST methods
    hideTurtle() {
        if (this.isVisible) {
            // Erasing needs refinement if clearTurtle isn't perfect
            // this.clearTurtle(); // Temporarily disable complex erase
            this.isVisible = false;
            // Need external redraw trigger
        }
    }

    showTurtle() {
        if (!this.isVisible) {
            this.isVisible = true;
            // Need external redraw trigger
            // this.drawTurtle(); // Don't draw immediately, let the main loop handle it
        }
    }
}
