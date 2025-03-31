// lib/turtle.ts

export class Turtle {
    x: number = 0; // Initializer
    y: number = 0; // Initializer
    angle: number = 0; // Degrees, 0 is UP, positive is clockwise - Initializer
    isPenDown: boolean = true; // Initializer
    color: string = '#000000'; // Initializer
    private backgroundColor: string; // No default here, set in constructor
    private ctx: CanvasRenderingContext2D;
    private canvasWidth: number;
    private canvasHeight: number;
    private onBgChange: ((color: string) => void) | null = null; // Callback for bg change
    private isVisible: boolean = true; // Added visibility flag

    constructor(
        private ctx: CanvasRenderingContext2D,
        private width: number,
        private height: number,
        initialBackgroundColor: string, // Receive initial color
        onBgChange?: (color: string) => void // Optional callback
    ) {
        this.ctx = ctx;
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.backgroundColor = initialBackgroundColor || 'rgb(0,0,0)';
        this.onBgChange = onBgChange || null; // Store the callback
        this.isVisible = true; // Ensure visible initially
        this.home();
        this.penDown();
        this.setPenColor(255, 255, 255); // Default pen color to white
        // No need to call clearScreen here usually, let initial render handle it or call externally
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
         // Canvas angle = Logo angle - 90 degrees
        return (this.angle - 90) * (Math.PI / 180);
    }

    home(): void {
        this.x = this.canvasWidth / 2;
        this.y = this.canvasHeight / 2;
        this.angle = 0;
        this.isPenDown = true;
        this.color = '#000000';
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

        console.log(`Move FORWARD ${distance}. New Pos: (${this.x.toFixed(2)}, ${this.y.toFixed(2)})`);

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
        // Console log for backward is handled within forward's console.log check for negative dist
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
        console.log(`Set X: From ${this.x.toFixed(2)} to ${newX.toFixed(2)} (Logo X: ${x})`);
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
        console.log(`Set Y: From ${this.y.toFixed(2)} to ${newY.toFixed(2)} (Logo Y: ${y})`);
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
        console.log(`Set Pos: To (${newX.toFixed(2)}, ${newY.toFixed(2)}) (Logo Pos: ${x}, ${y})`);
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
          const ctx = this.ctx;
    const currentAngle = this.angle; // Get angle value
    const rotationRadians = this._getCanvasAngleRad(); // Calculate radians

    // *** Add this log ***
    console.log(`[drawTurtle] Rendering turtle at angle: ${currentAngle} degrees, applying rotation: ${(rotationRadians * 180 / Math.PI).toFixed(1)} degrees`);

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(rotationRadians); // Use the calculated value

        // Turtle properties
        const bodyRadiusX = 8;
        const bodyRadiusY = 10;
        // Make head a perfect circle for clarity, placed forward (negative Y)
        const headRadius = 4;
        // Position the center of the head slightly *in front* of the body's front edge.
        const headCenterY = -(bodyRadiusY + headRadius * 0.5); // Center Y in rotated coords
        const legLength = 5; // Slightly longer legs
        const legWidth = 3;
        const legOutwardOffset = bodyRadiusX + legWidth * 0.5 - 1; // How far legs stick out sideways
        const legForwardOffset = bodyRadiusY * 0.3; // How far legs are towards front/back

        // Colors
        const bodyColor = '#609966';
        const headColor = '#40513B';
        const outlineColor = '#1A4D2E';
        const penUpColorBody = '#9DC08B';
        const penUpColorHead = '#6b8e6b'; // Slightly darker "up" color for head

        ctx.lineWidth = 1;
        ctx.strokeStyle = outlineColor;

        // Determine fill colors based on pen state
        const currentBodyFill = this.isPenDown ? bodyColor : penUpColorBody;
        const currentHeadFill = this.isPenDown ? headColor : penUpColorHead;


        // --- Draw Legs ---
        // Draw them rotated slightly outwards for a more 'turtle' look
        ctx.fillStyle = currentBodyFill;

        // Helper function to draw a rotated leg
        const drawLeg = (x: number, y: number, angleDeg: number) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angleDeg * Math.PI / 180);
            // Draw rectangle centered around the new origin
            ctx.fillRect(-legWidth / 2, -legLength / 2, legWidth, legLength);
            ctx.strokeRect(-legWidth / 2, -legLength / 2, legWidth, legLength);
            ctx.restore();
        };

        // Front-left leg (points forward-left)
        drawLeg(-legOutwardOffset, -legForwardOffset, -30);
        // Front-right leg (points forward-right)
        drawLeg( legOutwardOffset, -legForwardOffset, 30);
        // Back-left leg (points backward-left)
        drawLeg(-legOutwardOffset, legForwardOffset, -150);
        // Back-right leg (points backward-right)
        drawLeg( legOutwardOffset, legForwardOffset, 150);


        // --- Draw Body (Oval - Drawn after legs to overlap slightly) ---
        ctx.beginPath();
        ctx.ellipse(0, 0, bodyRadiusX, bodyRadiusY, 0, 0, Math.PI * 2);
        ctx.fillStyle = currentBodyFill;
        ctx.fill();
        ctx.stroke();

        // --- Draw Head (Circle - Positioned along the negative Y axis = Forward) ---
        ctx.beginPath();
        // Position center at (0, headCenterY) in the rotated coordinate system
        ctx.arc(0, headCenterY, headRadius, 0, Math.PI * 2);
        ctx.fillStyle = currentHeadFill;
        ctx.fill();
        ctx.stroke();

        // --- Draw Tail (Small triangle - Pointing backward = positive Y) ---
        ctx.beginPath();
        const tailBaseY = bodyRadiusY; // Base of tail starts at back of body
        const tailTipY = bodyRadiusY + 6; // Tip points further back
        const tailWidth = 4;
        ctx.moveTo(0, tailBaseY); // Start at back center
        ctx.lineTo(-tailWidth / 2, tailTipY);
        ctx.lineTo( tailWidth / 2, tailTipY);
        ctx.closePath();
        ctx.fillStyle = currentBodyFill; // Match body color
        ctx.fill();
        ctx.stroke();


        ctx.restore(); // Restore original canvas state
    }

    getBackgroundColor(): string {
        return this.backgroundColor;
    }

    // Helper to erase the turtle shape by drawing background color over it
    private clearTurtle() {
        // Save current state
        this.ctx.save();
        this.ctx.translate(this.x, this.y);
        this.ctx.rotate(this.angle * Math.PI / 180);

        // Use current background color for erasing
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.strokeStyle = this.backgroundColor; // Use bg color for stroke too
        this.ctx.lineWidth = 1; // Match line width? Or just fill? Fill is safer.

        // Draw the same triangle shape but filled/stroked with background color
        this.ctx.beginPath();
        this.ctx.moveTo(0, -10); // Tip
        this.ctx.lineTo(5, 5);   // Bottom right
        this.ctx.lineTo(-5, 5);  // Bottom left
        this.ctx.closePath();
        this.ctx.fill();   // Fill with background color
        // this.ctx.stroke(); // Optional: Stroke with background color if needed

        // Restore previous state
        this.ctx.restore();
    }

    // Added HT/ST methods
    hideTurtle() {
        if (this.isVisible) {
            this.clearTurtle(); // Erase the current turtle
            this.isVisible = false;
        }
    }

    showTurtle() {
        if (!this.isVisible) {
            this.isVisible = true;
            this.drawTurtle(); // Draw the turtle immediately
        }
    }
}
