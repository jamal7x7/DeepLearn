// lib/logoInterpreter.ts
// import { Turtle } from './turtle'; // No longer needed for direct drawing
import { tokenize } from './lexer';
import { Parser } from './parser';
import {
    Program, Statement, Token, TokenType, ASTNode, CommandNode, NumberNode, RepeatNode,
    ProcedureDefinitionNode, ProcedureCallNode, VariableNode, Expression, RandomNode,
    BinaryOpNode, IfNode, OutputNode, ComparisonNode,
    TurtleState, TurtleAction, MoveAction, TurnAction, PenAction, ColorAction, ClearAction, HomeAction, WaitAction, VisibilityAction // Import action types
} from './types';

// Define a structure to hold procedure definitions
interface Procedure {
    parameters: string[];
    body: Statement[];
}

// Define a structure for execution scope (variables)
type Scope = Map<string, number | string | boolean>;

// --- Helper Functions ---
function degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

function normalizeAngle(angle: number): number {
    let normalized = angle % 360;
    if (normalized < 0) {
        normalized += 360;
    }
    return normalized;
}

// Simple RGB to CSS string converter
function rgbToCssString(r: number, g: number, b: number): string {
    // Clamp values to 0-255 and ensure they are integers
    const r_ = Math.max(0, Math.min(255, Math.round(r)));
    const g_ = Math.max(0, Math.min(255, Math.round(g)));
    const b_ = Math.max(0, Math.min(255, Math.round(b)));
    return `rgb(${r_}, ${g_}, ${b_})`;
}
// --- End Helper Functions ---


export class LogoInterpreter {
    private procedures: Map<string, Procedure> = new Map();
    private globalScope: Scope = new Map();
    private executionLog: string[] = [];
    private parseErrors: string[] = [];
    private actions: TurtleAction[] = []; // Array to store generated actions
    private turtleState!: TurtleState; // Initialized in execute/reset

    // Removed setTurtle

    getLog(): string[] {
        return [...this.parseErrors, ...this.executionLog];
    }

    private log(message: string) {
        console.log(`Interpreter: ${message}`);
        this.executionLog.push(message);
    }

    // Error logger specifically for the Parser
    private logParseError = (message: string, token: Token | null): void => {
        const location = token ? ` near '${token.value}' (line ${token.line}, col ${token.column})` : '';
        const errorMsg = `PARSE ERROR: ${message}${location}`;
        console.error(errorMsg);
        this.parseErrors.push(errorMsg); // Store in parse errors list
    }

    // Error logger for runtime execution errors
    // Accepting line number directly to simplify type issues
    private logRuntimeError(message: string, line?: number): void {
        const location = line !== undefined ? ` (approx. line ${line})` : ''; // Check if line number is provided
        const errorMsg = `RUNTIME ERROR: ${message}${location}`;
        console.error(errorMsg);
        // Avoid adding duplicate errors if they bubble up
        if (!this.executionLog.includes(errorMsg)) {
            this.executionLog.push(errorMsg);
        }
        // Optionally re-throw to stop execution immediately
        throw new Error(errorMsg);
    }

    private resetState(): void {
        this.executionLog = [];
        this.parseErrors = [];
        this.procedures = new Map();
        this.globalScope = new Map();
        this.actions = [];
        // Initialize turtle state (adjust defaults as needed)
        this.turtleState = {
            x: 0, // Assuming canvas center is 0,0 or adjusted later
            y: 0,
            angle: 0, // 0 degrees often means facing upwards in Logo
            penDown: true,
            penColor: 'rgb(0, 0, 0)', // Default black
            isVisible: true,
        };
        this.log("Interpreter state reset.");
    }


    async execute(code: string): Promise<TurtleAction[]> { // Return actions
        this.resetState(); // Reset all state including actions and turtleState
        this.log("Starting execution...");

        // --- Phase 1: Lexing ---
        this.log("Lexing code...");
        const tokens = tokenize(code);
        // Optional: Log tokens for debugging
        // console.log("Tokens:", tokens.map(t => `${TokenType[t.type]}:${t.value}`).join(' '));

        // --- Phase 2: Parsing ---
        this.log("Parsing tokens...");
        const parser = new Parser(tokens, this.logParseError);
        const programAst: Program = parser.parse();

        // Check if parsing generated errors
        if (this.parseErrors.length > 0) {
            this.log("Execution aborted due to parsing errors.");
            return this.actions; // Return actions generated so far (likely empty)
        }

        // Optional: Log the AST for debugging
        // console.log("AST:", JSON.stringify(programAst, null, 2));
        this.log("Parsing successful. Interpreting AST...");

        // --- Phase 3: Interpretation ---
        try {
            await this.interpretProgram(programAst, this.globalScope); // Await the async interpretation
            this.log("Execution finished.");
        } catch (error: any) {
            // Catch runtime errors
            this.log(`Execution aborted due to runtime error: ${error.message}`);
            // Return actions generated so far, even if execution failed mid-way
            return this.actions;
        }

        // No final redraw here - animation component handles drawing
        this.log("Action generation finished.");
        return this.actions; // Return the generated actions
    }

    // --- AST Interpretation Methods ---

    private async interpretProgram(program: Program, scope: Scope): Promise<void> { // Make async
        // First pass: Define all procedures globally
        for (const statement of program) {
            if (statement.type === 'ProcedureDefinition') {
                this.defineProcedure(statement);
            }
        }

        // Second pass: Execute top-level statements sequentially
        for (const statement of program) {
            // Skip definitions in the execution pass
            if (statement.type !== 'ProcedureDefinition') {
               await this.interpretStatement(statement, scope); // Await each statement
            }
        }
    }

    private defineProcedure(node: ProcedureDefinitionNode): void {
        const name = node.name.toUpperCase(); // Store procedure names case-insensitively
        if (this.procedures.has(name)) {
            // Allow redefinition, maybe log a warning?
            this.log(`Warning: Redefining procedure '${name}' (line ${node.line})`);
        }
        this.procedures.set(name, {
            parameters: node.parameters,
            body: node.body
        });
        this.log(`Defined procedure: ${name}`);
    }

    // Interpret a single statement within a given scope
    private async interpretStatement(statement: Statement, scope: Scope): Promise<void> {
        // No turtle check needed anymore
        switch (statement.type) {
            case 'Command':
                await this.executeCommand(statement, scope); // Await
                break;
            case 'ProcedureCall':
                await this.executeProcedureCall(statement, scope); // Await
                break;
            case 'Repeat':
                await this.executeRepeat(statement, scope); // Await
                break;
            case 'If':
                await this.executeIf(statement, scope); // Await
                break;
            case 'Output':
                // OUTPUT is handled within procedure calls, shouldn't be top-level directly usually
                this.logRuntimeError("OUTPUT command used outside of a procedure", statement.line);
                break;
            case 'ProcedureDefinition':
                // Already handled in the first pass of interpretProgram
                break;
            // Add cases for other statement types (e.g., MAKE for variables)
            default:
                // Use assertion for unexpected node types during development
                const _exhaustiveCheck: never = statement;
                // Try logging with line number if available on the statement
                const lineNum = (statement as any)?.line;
                this.logRuntimeError(`Unknown statement type encountered during interpretation: ${(_exhaustiveCheck as any)?.type}`, lineNum);
        }
    }

    // --- Command Execution ---

    private async executeCommand(node: CommandNode, scope: Scope): Promise<void> {
        // No turtle check needed anymore
        const command = node.command;
        const args = node.args.map(arg => this.evaluateExpression(arg, scope));

        // Helper to validate argument count and types (remains the same)
        const checkArgs = (expectedCount: number, types?: ('number' | 'string' | 'any')[]) => {
            if (args.length !== expectedCount) {
                this.logRuntimeError(`${command} requires ${expectedCount} arguments, got ${args.length}`, node.line);
            }
            if (types) {
                for (let i = 0; i < expectedCount; i++) {
                    const argType = typeof args[i];
                    const expectedType = types[i];
                    const argNode = node.args[i]; // Get the specific argument node
                    // Ensure node.args[i] exists before accessing it for error reporting
                    if (expectedType !== 'any' && argType !== expectedType) {
                        // Pass the line number of the specific argument node if it exists
                        this.logRuntimeError(`Argument ${i + 1} for ${command} must be a ${expectedType}, got ${argType}`, argNode?.line);
                    } else if (!argNode && i < expectedCount) {
                         // Log against the main command node's line if arg is missing
                         this.logRuntimeError(`Missing argument ${i + 1} for ${command}`, node.line);
                    }
                }
            }
        };

        this.log(`Executing command: ${command} ${args.join(' ')}`);

        try {
            switch (command) {
                case 'FD':
                case 'FORWARD':
                    checkArgs(1, ['number']);
                    this.executeMove(args[0] as number); // Positive distance for FD
                    break;
                case 'BK':
                case 'BACKWARD':
                    checkArgs(1, ['number']);
                    this.executeMove(-(args[0] as number)); // Negative distance for BK
                    break;
                case 'RT':
                case 'RIGHT':
                    checkArgs(1, ['number']);
                    this.executeTurn(args[0] as number); // Positive angle for RT
                    break;
                case 'LT':
                case 'LEFT':
                    checkArgs(1, ['number']);
                    this.executeTurn(-(args[0] as number)); // Negative angle for LT
                    break;
                case 'PU':
                case 'PENUP':
                    checkArgs(0);
                    this.executePenChange(false);
                    break;
                case 'PD':
                case 'PENDOWN':
                    checkArgs(0);
                    this.executePenChange(true);
                    break;
                case 'CS':
                case 'CLEARSCREEN':
                    checkArgs(0);
                    this.executeClearScreen(); // Includes HOME logic now
                    break;
                case 'HOME':
                    checkArgs(0);
                    this.executeHome();
                    break;
                case 'SETPC':
                case 'SETPENCOLOR':
                    // Assuming args are R, G, B (0-255 or similar range)
                    checkArgs(3, ['number', 'number', 'number']);
                    this.executeColorChange(args[0] as number, args[1] as number, args[2] as number);
                    break;
                case 'WAIT':
                    checkArgs(1, ['number']);
                    // Assuming wait time is in ticks or a unit convertible to ms
                    // Let's treat it as 1/60th of a second per tick for now
                    const waitDuration = (args[0] as number) * (1000 / 60);
                    this.executeWait(waitDuration);
                    break;
                 case 'HT':
                 case 'HIDETURTLE':
                    checkArgs(0);
                    this.executeVisibilityChange(false);
                    break;
                 case 'ST':
                 case 'SHOWTURTLE':
                    checkArgs(0);
                    this.executeVisibilityChange(true);
                    break;
                // SETHEADING, SETPOS, SETX, SETY, SETBACKGROUND, PRINT etc. need implementation
                // REPEAT, IF, OUTPUT are handled by interpretStatement
                // RANDOM is handled by evaluateExpression
                // TO, END are handled by parsing/definition phase
                default:
                    this.logRuntimeError(`Interpreter logic missing for command "${command}"`, node.line);
            }
        } catch (error: any) {
            // Catch potential errors from turtle methods themselves
                    this.logRuntimeError(`Error during ${command}: ${error.message}`, node.line);
                    // No need to return promise, method is void
        }
        // No drawing calls here
    }

    // --- Action Generation Helpers ---

    private executeMove(distance: number): void {
        const startX = this.turtleState.x;
        const startY = this.turtleState.y;
        const angleRad = degreesToRadians(this.turtleState.angle);

        // Standard Logo: 0 degrees is up, positive Y is up.
        // Canvas: 0 degrees is right, positive Y is down.
        // Let's assume standard Logo coordinates for state, conversion happens during rendering.
        // If 0 degrees is UP (Logo standard):
        const endX = startX + distance * Math.sin(angleRad);
        const endY = startY + distance * Math.cos(angleRad);
        // If 0 degrees is RIGHT (Canvas standard):
        // const endX = startX + distance * Math.cos(angleRad);
        // const endY = startY + distance * Math.sin(angleRad);


        const action: MoveAction = {
            type: 'move',
            startX,
            startY,
            endX,
            endY,
            distance,
            penDown: this.turtleState.penDown,
            penColor: this.turtleState.penColor,
        };
        this.actions.push(action);

        // Update state
        this.turtleState.x = endX;
        this.turtleState.y = endY;
    }

    private executeTurn(degrees: number): void {
        const startAngle = this.turtleState.angle;
        const endAngle = normalizeAngle(startAngle + degrees);

        const action: TurnAction = {
            type: 'turn',
            startAngle,
            endAngle,
            degrees,
        };
        this.actions.push(action);

        // Update state
        this.turtleState.angle = endAngle;
    }

    private executePenChange(penDown: boolean): void {
        if (this.turtleState.penDown !== penDown) {
            this.turtleState.penDown = penDown;
            const action: PenAction = { type: 'pen', penDown };
            this.actions.push(action);
        }
    }

     private executeColorChange(r: number, g: number, b: number): void {
        const newColor = rgbToCssString(r, g, b);
        if (this.turtleState.penColor !== newColor) {
            this.turtleState.penColor = newColor;
            const action: ColorAction = { type: 'color', color: newColor };
            this.actions.push(action);
        }
    }

    private executeClearScreen(): void {
        // CS often implies HOME as well in Logo
        this.actions.push({ type: 'clear' });
        this.executeHome(true); // Pass flag to avoid duplicate HOME action if CS implies it
    }

    private executeHome(calledFromCS: boolean = false): void {
        const startX = this.turtleState.x;
        const startY = this.turtleState.y;
        const startAngle = this.turtleState.angle;

        // Check if already home to avoid redundant actions
        const needsMove = startX !== 0 || startY !== 0;
        const needsTurn = startAngle !== 0; // Assuming home angle is 0

        if (needsMove) {
             // Generate a move action back to origin
             const homeMoveAction: MoveAction = {
                type: 'move',
                startX,
                startY,
                endX: 0,
                endY: 0,
                distance: Math.sqrt(startX * startX + startY * startY), // Calculate distance
                penDown: false, // HOME move is typically pen up
                penColor: this.turtleState.penColor, // Color doesn't matter if pen up
            };
            this.actions.push(homeMoveAction);
            this.turtleState.x = 0;
            this.turtleState.y = 0;
        }

        if (needsTurn) {
            // Generate a turn action to angle 0
             const homeTurnAction: TurnAction = {
                type: 'turn',
                startAngle,
                endAngle: 0,
                degrees: -startAngle, // Turn required to get back to 0
            };
            this.actions.push(homeTurnAction);
            this.turtleState.angle = 0;
        }

        // Add a specific HOME action *if* not called implicitly by CS
        // and if any state actually changed.
        if (!calledFromCS && (needsMove || needsTurn)) {
             // This specific 'home' action might be redundant if move/turn are generated,
             // but can be useful for the animator to know HOME was explicitly called.
             // Consider if it's needed based on animation logic.
             // this.actions.push({ type: 'home' });
        }

        // Ensure pen is down after HOME, as per some Logo standards
        this.executePenChange(true);
    }

     private executeWait(duration: number): void {
        if (duration > 0) {
            this.actions.push({ type: 'wait', duration });
        }
    }

     private executeVisibilityChange(isVisible: boolean): void {
        if (this.turtleState.isVisible !== isVisible) {
            this.turtleState.isVisible = isVisible;
            this.actions.push({ type: 'visibility', isVisible });
        }
    }


    // --- Control Structures ---

    private async executeRepeat(node: RepeatNode, scope: Scope): Promise<void> {
        // Cast node.count to Expression to satisfy evaluateExpression
        const countValue = this.evaluateExpression(node.count as Expression, scope);
        if (typeof countValue !== 'number' || !Number.isInteger(countValue) || countValue < 0) {
            // Use the original node.count for line number reporting
            this.logRuntimeError(`REPEAT count must be a non-negative integer, got ${countValue}`, node.count.line);
            return;
        }

        this.log(`Executing REPEAT ${countValue} times...`);
        for (let i = 0; i < countValue; i++) {
            // Execute body in the current scope sequentially
            for (const statement of node.body) {
                await this.interpretStatement(statement, scope); // Await
            }
        }
        this.log(`Finished REPEAT block.`);
    }

     private async executeIf(node: IfNode, scope: Scope): Promise<void> { // Make async
        const conditionValue = this.evaluateExpression(node.condition, scope);
        // In Logo, often 0 is false, non-zero is true. Let's adopt that.
        // Or handle boolean results from comparisons properly.
        let conditionIsTrue: boolean;
        if (typeof conditionValue === 'boolean') {
            conditionIsTrue = conditionValue;
        } else if (typeof conditionValue === 'number') {
            conditionIsTrue = conditionValue !== 0;
        } else {
             this.logRuntimeError(`IF condition must evaluate to a number or boolean, got ${typeof conditionValue}`, node.condition.line);
             return;
        }


        this.log(`Executing IF statement (condition: ${conditionValue} -> ${conditionIsTrue})...`);
        if (conditionIsTrue) {
            this.log(`IF condition is true. Executing body...`);
            // Execute body in the current scope sequentially
            for (const statement of node.body) {
                await this.interpretStatement(statement, scope); // Await
            }
            this.log(`Finished IF body.`);
        } else {
             this.log(`IF condition is false. Skipping body.`);
        }
    }


    // --- Procedure Handling ---

    private async executeProcedureCall(node: ProcedureCallNode, currentScope: Scope): Promise<void> { // Make async
        const name = node.name.toUpperCase();
        const procedure = this.procedures.get(name);

        if (!procedure) {
            this.logRuntimeError(`Undefined procedure "${node.name}"`, node.line);
            return;
        }

        if (node.arguments.length !== procedure.parameters.length) {
            this.logRuntimeError(`Procedure "${node.name}" expects ${procedure.parameters.length} arguments, got ${node.arguments.length}`, node.line);
            return;
        }

        // Evaluate arguments in the *current* scope
        const argValues = node.arguments.map(arg => this.evaluateExpression(arg, currentScope));

        // Create a new scope for the procedure execution
        const procedureScope: Scope = new Map(this.globalScope); // Inherit global scope? Or start fresh? Let's inherit globals.
        // Add parameters to the procedure's scope
        procedure.parameters.forEach((paramName, index) => {
            procedureScope.set(paramName.toUpperCase(), argValues[index]); // Store param names uppercase
        });

        this.log(`Calling procedure: ${node.name} with args: ${argValues.join(', ')}`);

        // Execute the procedure body within its new scope sequentially
        try {
            for (const statement of procedure.body) {
               await this.interpretStatement(statement, procedureScope); // Await
                // Check for OUTPUT value? Need a way to return values.
                // This requires modifying interpretStatement and evaluateExpression
                // to handle potential return values, perhaps using exceptions or a dedicated return mechanism.
                // For now, procedures don't return values.
            }
        } catch (error: any) {
             // Catch errors from within the procedure call
             this.logRuntimeError(`Error during procedure "${node.name}": ${error.message}`, node.line);
        }

        this.log(`Finished procedure: ${node.name}`);
    }


    // --- Expression Evaluation ---

    // Evaluate an expression node within a given scope
    private evaluateExpression(expr: Expression, scope: Scope): number | string | boolean {
        switch (expr.type) {
            case 'Number':
                return expr.value;
            case 'Variable':
                const varName = expr.name.toUpperCase();
                if (scope.has(varName)) {
                    return scope.get(varName)!;
                } else {
                    this.logRuntimeError(`Undefined variable ":${expr.name}"`, expr.line);
                    return 0; // Return a default or throw? Throwing is safer.
                }
            case 'BinaryOp':
                return this.evaluateBinaryOp(expr, scope);
            case 'Comparison': // Added Comparison case
                return this.evaluateComparison(expr, scope);
            case 'Random':
                return this.evaluateRandom(expr, scope);
            case 'ProcedureCall':
                // This is tricky. Procedures need a way to return values (e.g., via OUTPUT).
                // For now, assume procedures called in expressions must use OUTPUT.
                // We need a mechanism to capture the output value.
                this.logRuntimeError(`Procedure calls within expressions not fully supported yet (needs OUTPUT handling)`, expr.line);
                return 0; // Placeholder
            // Add cases for UnaryOp if implemented differently, etc.
            default:
                 // Use assertion for unexpected node types during development
                const _exhaustiveCheck: never = expr;
                 // Log error without the node, as 'expr' has type 'never' here
                this.logRuntimeError(`Unknown expression type encountered during evaluation: ${(_exhaustiveCheck as any)?.type}`);
                return 0; // Placeholder
        }
    }

    private evaluateBinaryOp(node: BinaryOpNode, scope: Scope): number {
        const left = this.evaluateExpression(node.left, scope);
        const right = this.evaluateExpression(node.right, scope);

        if (typeof left !== 'number' || typeof right !== 'number') {
            this.logRuntimeError(`Arithmetic operations require number operands, got ${typeof left} and ${typeof right}`, node.line);
            return 0; // Placeholder
        }

        switch (node.operator) {
            case '+': return left + right;
            case '-': return left - right;
            case '*': return left * right;
            case '/':
                if (right === 0) {
                    this.logRuntimeError(`Division by zero`, node.line);
                    return 0; // Placeholder or Infinity?
                }
                return left / right;
            default:
                this.logRuntimeError(`Unknown binary operator "${node.operator}"`, node.line);
                return 0; // Placeholder
        }
    }

    // Added evaluator for Comparison nodes
    private evaluateComparison(node: ComparisonNode, scope: Scope): boolean {
        const left = this.evaluateExpression(node.left, scope);
        const right = this.evaluateExpression(node.right, scope);

        // Allow comparisons between numbers or strings (basic implementation)
        if (typeof left !== typeof right) {
             // Allow comparing number and string representation of number? Maybe not for strictness.
             this.logRuntimeError(`Cannot compare values of different types: ${typeof left} and ${typeof right}`, node.line);
             return false;
        }

        // Perform comparison based on type
        switch (node.operator) {
            case '<': return left < right;
            case '>': return left > right;
            case '=': return left === right; // Use strict equality
            default:
                this.logRuntimeError(`Unknown comparison operator "${node.operator}"`, node.line);
                return false;
        }
    }


    private evaluateRandom(node: RandomNode, scope: Scope): number {
        // Cast node.max to Expression to satisfy evaluateExpression
        const maxVal = this.evaluateExpression(node.max as Expression, scope);
        if (typeof maxVal !== 'number' || !Number.isInteger(maxVal) || maxVal <= 0) {
             // Use the original node.max for line number reporting
            this.logRuntimeError(`RANDOM requires a positive integer argument, got ${maxVal}`, node.max.line);
            return 0; // Placeholder
        }
        // Logo's RANDOM is often exclusive of the max, returning 0 to max-1
        return Math.floor(Math.random() * maxVal);
    }

}

// Remove the old standalone isNaN helper if not needed elsewhere
// function isNaN(value: any): boolean {
//     return Number.isNaN(Number(value));
// }
