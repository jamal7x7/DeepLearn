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
    public animationDuration: number = 500; // Default animation duration in ms (controls speed)
    private animationFrameId: number | null = null; // For cancelling animations
    private redrawCallback: () => void = () => {}; // Callback to trigger full canvas redraw

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

    // Method to set the redraw callback
    setRedrawCallback(callback: () => void): void {
        this.redrawCallback = callback;
    }

    // Method to set the animation speed (duration)
    setAnimationDuration(durationMs: number): void {
        // Add some bounds, e.g., 0ms (instant) to 5000ms (very slow)
        this.animationDuration = Math.max(0, Math.min(durationMs, 5000));
        console.log(`Animation duration set to: ${this.animationDuration}ms`);
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

    async home(): Promise<void> {
        const targetX = this.canvasWidth / 2;
        const targetY = this.canvasHeight / 2;
        const targetAngle = 0; // Default UP

        const startX = this.x;
        const startY = this.y;
        const startAngle = this.angle;

        const deltaX = targetX - startX;
        const deltaY = targetY - startY;

        // Calculate shortest angle delta for rotation
        let deltaAngle = targetAngle - startAngle;
        if (deltaAngle > 180) deltaAngle -= 360;
        if (deltaAngle <= -180) deltaAngle += 360;

        console.log(`Animating HOME. Target: (${targetX.toFixed(2)}, ${targetY.toFixed(2)}), Angle: ${targetAngle}`);

        // Animate position and angle simultaneously
        await this._animate((progress) => {
            this.x = startX + deltaX * progress;
            this.y = startY + deltaY * progress;
            this.angle = this._normalizeAngle(startAngle + deltaAngle * progress);
            // Move context path, don't draw line
            this.ctx.moveTo(this.x, this.y);
        }, this.animationDuration); // Use standard duration

        // Ensure final state is exact
        this.x = targetX;
        this.y = targetY;
        this.angle = targetAngle;
        this.isPenDown = true; // Pen is down after home
        // this.color = '#FFFFFF'; // Reset pen color? Let's keep current color.
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath(); // Reset path state
        this.ctx.moveTo(this.x, this.y); // Move context to final home position

        this.redrawCallback(); // Final redraw
        console.log(`Animation HOME complete. Final Pos: (${this.x.toFixed(2)}, ${this.y.toFixed(2)}), Angle: ${this.angle}`);
    }


    // Add reset method
    async reset(): Promise<void> {
        console.log("Resetting Turtle state and clearing screen...");
        // Cancel any ongoing animation first
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        await this.clearScreen(); // Await the async clearScreen
        this.style = DEFAULT_TURTLE_STYLE; // Reset style on full reset
        this.redrawCallback(); // Redraw after reset
    }

    async clearScreen(): Promise<void> {
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        // Cancel any ongoing animation before resetting home
         if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        await this.home(); // Reset position after clearing (home is now async)
        // Notify about background color potentially being applied
        this.onBgChange?.(this.backgroundColor);
        this.redrawCallback(); // Redraw after clear
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

    async right(degrees: number): Promise<void> {
        const startAngle = this.angle;
        const targetAngle = this._normalizeAngle(startAngle + degrees);
        // Handle angle wrapping correctly for animation (e.g., 350 -> 10 should go clockwise)
        const deltaAngle = degrees; // Animate the actual turn amount

        console.log(`Animating RIGHT ${degrees}. Target Angle: ${targetAngle}`);

        await this._animate((progress) => {
            // Interpolate the angle change directly
            this.angle = this._normalizeAngle(startAngle + deltaAngle * progress);
        }, this.animationDuration / 2); // Turns are usually faster

        this.angle = targetAngle; // Ensure final angle is exact
        this.redrawCallback(); // Final redraw
        console.log(`Animation RIGHT complete. Final Angle: ${this.angle}`);
    }

    async left(degrees: number): Promise<void> {
        await this.right(-degrees); // Reuse right animation logic
        console.log(`Animation LEFT ${degrees} complete.`);
    }

    // --- Animation Helper ---
    private async _animate(updateFn: (progress: number) => void, duration: number): Promise<void> {
        return new Promise((resolve) => {
            if (duration <= 0) {
                updateFn(1); // Apply final state immediately
                this.redrawCallback(); // Redraw once
                resolve();
                return;
            }

            const startTime = performance.now();

            const step = (currentTime: number) => {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / duration, 1);

                updateFn(progress); // Update state based on progress
                this.redrawCallback(); // Trigger redraw on each frame

                if (progress < 1) {
                    this.animationFrameId = requestAnimationFrame(step);
                } else {
                    this.animationFrameId = null;
                    resolve(); // Animation complete
                }
            };

            // Cancel any previous animation frame
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
            }
            this.animationFrameId = requestAnimationFrame(step);
        });
    }

    // --- Animated Movement Methods ---

    async forward(distance: number): Promise<void> {
        const startX = this.x;
        const startY = this.y;
        const angleRad = this._getCanvasAngleRad();
        const targetX = startX + distance * Math.cos(angleRad);
        const targetY = startY + distance * Math.sin(angleRad);
        const deltaX = targetX - startX;
        const deltaY = targetY - startY;

        console.log(`Animating FORWARD ${distance}. Target: (${targetX.toFixed(2)}, ${targetY.toFixed(2)})`);

        let lastX = startX;
        let lastY = startY;

        await this._animate((progress) => {
            const currentX = startX + deltaX * progress;
            const currentY = startY + deltaY * progress;

            if (this.isPenDown) {
                this.ctx.beginPath();
                this.ctx.moveTo(lastX, lastY);
                this.ctx.lineTo(currentX, currentY);
                this.ctx.stroke();
            }
            // Update turtle position *after* drawing the segment
            this.x = currentX;
            this.y = currentY;
            // Update last position for the next segment
            lastX = currentX;
            lastY = currentY;
            // Ensure the canvas path starts from the new position for subsequent non-animated commands or segments
            this.ctx.moveTo(this.x, this.y);

        }, this.animationDuration);

        // Ensure final position is exact
        this.x = targetX;
        this.y = targetY;
        this.ctx.moveTo(this.x, this.y); // Ensure context path is at the final spot
        this.redrawCallback(); // Final redraw to ensure turtle is in the exact final spot
        console.log(`Animation FORWARD complete. Final Pos: (${this.x.toFixed(2)}, ${this.y.toFixed(2)})`);
    }


    async backward(distance: number): Promise<void> {
        await this.forward(-distance); // Reuses forward animation logic
        console.log(`Animation BACKWARD ${distance} complete.`);
    }

    // Note: setPenColor and setBackgroundColor are instant changes, no animation needed.
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

    async setHeading(targetAngleInput: number): Promise<void> {
        const startAngle = this.angle;
        const targetAngle = this._normalizeAngle(targetAngleInput);

        // Calculate the shortest turn direction
        let deltaAngle = targetAngle - startAngle;
        if (deltaAngle > 180) deltaAngle -= 360;
        if (deltaAngle <= -180) deltaAngle += 360;

        console.log(`Animating SETHEADING to ${targetAngle}. Delta: ${deltaAngle}`);

        await this._animate((progress) => {
            this.angle = this._normalizeAngle(startAngle + deltaAngle * progress);
        }, this.animationDuration / 2); // Faster turns

        this.angle = targetAngle; // Ensure final angle is exact
        this.redrawCallback(); // Final redraw
        console.log(`Animation SETHEADING complete. Final Angle: ${this.angle}`);
    }


    // --- Animated Position Setting (No line drawing) ---

    async setX(logoX: number): Promise<void> {
        const targetX = this.canvasWidth / 2 + logoX;
        await this._animatePosition(targetX, this.y);
        console.log(`Animation SETX to ${logoX} complete.`);
    }

    async setY(logoY: number): Promise<void> {
        const targetY = this.canvasHeight / 2 - logoY; // Invert Y for canvas coords
        await this._animatePosition(this.x, targetY);
        console.log(`Animation SETY to ${logoY} complete.`);
    }

    async setPos(logoX: number, logoY: number): Promise<void> {
        const targetX = this.canvasWidth / 2 + logoX;
        const targetY = this.canvasHeight / 2 - logoY; // Invert Y
        await this._animatePosition(targetX, targetY);
        console.log(`Animation SETPOS to (${logoX}, ${logoY}) complete.`);
    }

    // Helper for animating position changes without drawing lines
    private async _animatePosition(targetX: number, targetY: number): Promise<void> {
        const startX = this.x;
        const startY = this.y;
        const deltaX = targetX - startX;
        const deltaY = targetY - startY;

        if (Math.abs(deltaX) < 0.01 && Math.abs(deltaY) < 0.01) {
             // Already at target, no animation needed
             this.ctx.moveTo(this.x, this.y); // Ensure context path is updated
             return;
        }

        console.log(`Animating position to (${targetX.toFixed(2)}, ${targetY.toFixed(2)})`);

        await this._animate((progress) => {
            this.x = startX + deltaX * progress;
            this.y = startY + deltaY * progress;
            // Crucially, DO NOT draw lineTo here, just update position
            this.ctx.moveTo(this.x, this.y); // Keep the context path updated
        }, this.animationDuration); // Use standard duration for jumps

        // Ensure final position is exact
        this.x = targetX;
        this.y = targetY;
        this.ctx.moveTo(this.x, this.y); // Ensure context path is at the final spot
        this.redrawCallback(); // Final redraw
    }


    // --- Non-Animated Methods (Keep original signatures if needed by interpreter) ---
    // We keep the non-async versions for compatibility if the interpreter doesn't await
    // but they will now call the async versions internally if animation is desired.
    // OR: We modify the interpreter to always call the async versions.
    // Let's assume the interpreter will be updated to call async versions.

    // Original synchronous methods (remove or comment out if interpreter is updated)
    /*
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
    */

    // --- Drawing ---

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

        const flipperLength = 10; // Reduced length
        const flipperWidth = 5;  // Slightly reduced width
        const flipperOutwardOffset = bodyRadiusX + flipperWidth * 0.05;
        const flipperForwardOffset = bodyRadiusY * 0.5;

        const backLegLength = 6;
        const backLegWidth = 5;
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

        // Helper function to draw a curved flipper shape
        const drawFlipper = (x: number, y: number, width: number, height: number, angleDeg: number, curveFactor: number) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angleDeg * Math.PI / 180); // Rotate the flipper itself

            const halfWidth = width / 2;
            const tipX = 0; // Tip is centered along the rotated axis
            const tipY = -height / 2; // Tip extends 'upwards' in local rotated coords
            const baseX = 0;
            const baseY = height / 2; // Base is 'downwards'

            // Control points for curves (adjust for desired curve)
            // Make control points pull the curve 'backwards' (towards positive Y in local coords)
            const controlX1 = -halfWidth * curveFactor;
            const controlY1 = tipY + (baseY - tipY) * 0.3; // Control point towards the base
            const controlX2 = halfWidth * curveFactor;
            const controlY2 = tipY + (baseY - tipY) * 0.3; // Control point towards the base

            ctx.beginPath();
            ctx.moveTo(baseX - halfWidth, baseY); // Start at base-left
            ctx.quadraticCurveTo(controlX1, controlY1, tipX, tipY); // Curve to tip from left
            ctx.quadraticCurveTo(controlX2, controlY2, baseX + halfWidth, baseY); // Curve from tip to base-right
            // Optional: Add a slight curve or line for the base connection
            ctx.lineTo(baseX - halfWidth, baseY); // Close path straight for now
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
        }; // <-- Added missing closing brace

        // Front-left Flipper (Negative angle for left side, positive curveFactor for backward curve)
        drawFlipper(-flipperOutwardOffset, -flipperForwardOffset, flipperWidth, flipperLength, -55, 1.5); // Angle adjusted slightly, added curveFactor
        // Front-right Flipper (Positive angle for right side, positive curveFactor for backward curve)
        drawFlipper( flipperOutwardOffset, -flipperForwardOffset, flipperWidth, flipperLength, 55, 1.5); // Angle adjusted slightly, added curveFactor
        // Back-left Leg
        drawBackLeg(-backLegOutwardOffset, backLegForwardOffset, backLegWidth, backLegLength, -135);
        // Back-right Leg
        drawBackLeg( backLegOutwardOffset, backLegForwardOffset, backLegWidth, backLegLength, 135);

      

        // --- Draw Head (Circle - Positioned forward) ---
        ctx.beginPath();
        ctx.arc(0, headCenterY, headRadius, 0, Math.PI * 2);
        ctx.fillStyle = currentHeadFill;
        ctx.fill();
        ctx.stroke();

        // --- Draw Tail (Shorter, stubbier triangle) ---
        ctx.beginPath();
        const tailBaseY = bodyRadiusY * 0.9;
        const tailTipY = bodyRadiusY - 4;
        const tailWidth = 5;
        ctx.moveTo(0, tailBaseY+4);
        ctx.lineTo(-tailWidth / 2, tailTipY+3);
        ctx.lineTo( tailWidth / 2, tailTipY+3);
        ctx.closePath();
        ctx.fillStyle = currentBodyFill; // Match body
        ctx.fill();
        ctx.stroke();

          // --- Draw Body (Oval - Drawn after legs) ---
        ctx.beginPath();
        ctx.ellipse(0, 0, bodyRadiusX, bodyRadiusY, 0, 0, Math.PI * 2);
        ctx.fillStyle = currentBodyFill;
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
