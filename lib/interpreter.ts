// lib/interpreter.ts
import { Turtle } from './turtle';
import { tokenize } from './lexer';
import { Parser } from './parser';
import {
    Token, TokenType, Program, Statement, ASTNode, CommandNode, NumberNode, RepeatNode,
    ProcedureDefinitionNode, ProcedureCallNode, VariableNode, Procedure, SymbolTable,
    RandomNode, BinaryOpNode, IfNode, OutputNode, ComparisonNode // Added new node types
} from './types';

// Custom error class specifically for OUTPUT signal
// This isn't strictly an "error", but using the error mechanism
// allows us to easily unwind the call stack during interpretation.
class OutputSignal extends Error {
    value: number; // The value being outputted
    node: ASTNode; // The OUTPUT node itself

    constructor(value: number, node: ASTNode) {
        super(`Outputting value: ${value}`); // Message isn't usually displayed
        this.name = "OutputSignal";
        this.value = value;
        this.node = node;
    }
}


// Custom error class for runtime interpretation errors
class RuntimeError extends Error {
    node: ASTNode | null;
    constructor(message: string, node: ASTNode | null = null) {
        const location = node ? ` at line ${node.line}, col ${node.column}` : '';
        // Ensure message ends with a period if it doesn't already.
        const formattedMessage = message.endsWith('.') ? message : message + '.';
        super(`${formattedMessage}${location}`);
        this.name = "RuntimeError";
        this.node = node;
    }
}


export class LogoInterpreter {
    private turtle: Turtle | null = null;
    private commandLog: string[] = [];
    private stopRequested: boolean = false; // Flag to signal stop
    // Global symbol table for procedures
    private procedures: SymbolTable = {};
    // Stack of execution scopes (for parameters/local variables)
    // The first element is the global scope (only procedures here),
    // subsequent elements are local scopes for procedure calls.
    private scopeStack: SymbolTable[] = [this.procedures];
    // Drawing context and origin for turtle rendering
    private ctx: CanvasRenderingContext2D | null = null;
    private canvasOriginX: number = 0;
    private canvasOriginY: number = 0;

    constructor() {
        // Initialize global scope (procedures are added during interpretation)
        this.scopeStack = [this.procedures];
    }

    setTurtle(turtle: Turtle) {
        this.turtle = turtle;
    }

    getLog(): string[] {
        return [...this.commandLog]; // Return a copy
    }

    private log(message: string) {
        console.log(`Interpreter: ${message}`);
        this.commandLog.push(message);
    }

    // Log runtime errors, associating them with AST nodes if possible
    private logRuntimeError(error: RuntimeError) {
        const errorMsg = `RUNTIME ERROR: ${error.message}`;
        console.error(errorMsg);
        this.commandLog.push(errorMsg);
    }

    // Log parsing errors
    private logParseError(message: string, token: Token | null = null) {
        const context = token ? ` (near token '${token.value}' line ${token.line}, col ${token.column})` : '';
        const errorMsg = `PARSE ERROR: ${message}${context}`;
        console.error(errorMsg);
        this.commandLog.push(errorMsg);
    }

    // Method to signal stopping execution
    public requestStop(): void {
        this.stopRequested = true;
        this.log("--- Stop Requested --- "); // Log the request
    }

    // Make execute async and return Promise<string[]>
    async execute(code: string): Promise<string[]> {
        this.stopRequested = false; // Reset stop flag at the beginning

        if (!this.turtle) {
            this.logRuntimeError(new RuntimeError("Turtle not initialized"));
            return this.commandLog; // Return current logs
        }

        this.commandLog = []; // Clear log for new execution
        this.procedures = {}; // Clear old procedures
        this.scopeStack = [this.procedures]; // Reset scope stack
        this.log("--- Execution Start ---");

        // 1. Tokenize
        const tokens = tokenize(code);
        this.log(`Tokens: ${tokens.map(t => t.value).join(' ')}`);

        // Check for lexer errors before parsing
        const lexerErrors = tokens.filter(t => t.type === TokenType.ERROR);
        if (lexerErrors.length > 0) {
            lexerErrors.forEach(err => this.logParseError(err.value, err));
            this.log("--- Execution Aborted (Lexer Errors) ---");
            return this.commandLog;
        }

        // 2. Parse
        const parser = new Parser(tokens, (msg, token) => this.logParseError(msg, token));
        const ast = parser.parse(); // Get the AST (Program)

        // Check if parsing produced errors (logged via logParseError)
        if (this.commandLog.some(msg => msg.startsWith("PARSE ERROR"))) {
             this.log("--- Execution Aborted (Parse Errors) ---");
             return this.commandLog;
        }

        this.log("AST generated successfully.");
        // console.log("AST:", JSON.stringify(ast, null, 2)); // Optional: Log AST for debugging

        // 3. Interpret AST (now async)
        this.turtle.reset(); // Reset turtle state before execution

        // Wrap the interpretation logic in a promise that execute will await
        await (async () => {
            try {
                await this.interpretStatements(ast); // Await the async interpretation
                // Final Touches moved inside async block
                if (!this.commandLog.some(msg => msg.startsWith("RUNTIME ERROR"))) {
                    if (this.ctx && this.turtle) {
                        this.turtle.drawTurtle(this.ctx, this.canvasOriginX, this.canvasOriginY);
                    }
                    this.log("--- Execution Finished ---");
                }
            } catch (error) {
                if (error instanceof RuntimeError) {
                    this.logRuntimeError(error);
                    this.log("--- Execution Aborted (Runtime Error) ---");
                } else if (error instanceof OutputSignal) {
                    // This shouldn't normally be caught here unless OUTPUT is misused at top level
                    this.logRuntimeError(new RuntimeError(`OUTPUT command used outside of a procedure call in an expression`, error.node));
                    this.log("--- Execution Aborted (Misused OUTPUT) ---");
                } else {
                    // Log unexpected errors
                    const unexpectedErrorMsg = `Unexpected runtime error: ${error instanceof Error ? error.message : String(error)}`;
                    console.error(unexpectedErrorMsg, error);
                    this.commandLog.push(`RUNTIME ERROR: ${unexpectedErrorMsg}`);
                    this.log("--- Execution Aborted (Unexpected Error) ---");
                }
            }
        })(); // Immediately invoke and await the async function

        // Return the final logs after interpretation is complete
        return this.commandLog;
    }

    setDrawingContext(ctx: CanvasRenderingContext2D, originX: number, originY: number) {
        this.ctx = ctx;
        this.canvasOriginX = originX;
        this.canvasOriginY = originY;
    }

    // --- AST Interpretation Methods ---

    private async interpretStatements(statements: Statement[]): Promise<void> {
        for (const statement of statements) {
            if (this.stopRequested) {
                // Throw a specific error or just log and stop
                this.log("--- Execution Stopped by User (in interpretStatements) ---");
                throw new Error("STOP"); // Use a simple error to signal stop
            }
            await this.visitStatement(statement); // Await each statement
        }
    }

    private async visitStatement(node: Statement): Promise<void> {
        if (!this.turtle) throw new RuntimeError("Turtle disappeared during execution!", node);

        switch (node.type) {
            case 'Command':
                await this.visitCommand(node); // Await command execution
                break;
            case 'Repeat':
                await this.visitRepeat(node); // Await repeat execution
                break;
            case 'ProcedureDefinition':
                this.visitProcedureDefinition(node); // Definition is synchronous
                break;
            case 'ProcedureCall':
                // Procedure calls used as statements don't return values here.
                // If a procedure call is used in an expression context, evaluateExpression handles it.
                await this.visitProcedureCall(node); // Corrected: Removed second argument
                break;
            case 'If': // Added IfNode case
                await this.visitIf(node as IfNode);
                break;
            case 'Output': // Added OutputNode case
                this.visitOutput(node as OutputNode); // Output throws signal, doesn't need await here
                break;
            default:
                // This check helps ensure all statement types are handled.
                // If you add a new Statement type, TypeScript will error here until you add a case.
                const exhaustiveCheck: never = node;
                throw new RuntimeError(`Unhandled statement type: ${(exhaustiveCheck as any).type}`, node);
        }
    }

    private visitProcedureDefinition(node: ProcedureDefinitionNode): void {
        const procNameUpper = node.name.toUpperCase();
        if (this.procedures[procNameUpper]) {
            // Allow redefinition, maybe log a warning?
            this.log(`Warning: Redefining procedure '${node.name}' (line ${node.line})`);
        }
        // Store the definition in the global procedure table
        this.procedures[procNameUpper] = {
            name: node.name, // Keep original case for potential future use?
            parameters: node.parameters,
            body: node.body,
            // Store line/col for potential future error reporting on definition itself
            line: node.line,
            column: node.column
        };
        this.log(`Defined procedure: ${node.name} with params: ${node.parameters.join(', ')}`);
    }

    // Modified to handle potential output and return value or void
    private async visitProcedureCall(node: ProcedureCallNode, expectOutput: boolean = false): Promise<number | void> {
        const procNameUpper = node.name.toUpperCase();
        const proc = this.procedures[procNameUpper];

        if (!proc || typeof proc === 'number') { // Ensure it's a procedure, not a variable
            throw new RuntimeError(`Undefined procedure '${node.name}'`, node);
        }

        if (node.arguments.length !== proc.parameters.length) {
            throw new RuntimeError(`Procedure '${proc.name}' expected ${proc.parameters.length} arguments, but got ${node.arguments.length}`, node);
        }

        // Create a new scope for this procedure call
        const localScope: SymbolTable = {};

        // Evaluate arguments in the *calling* scope and bind them to parameters in the *new* scope
        // Must await argument evaluation now
        for (let i = 0; i < proc.parameters.length; i++) {
            const paramName = proc.parameters[i];
            const argValue = await this.evaluateExpression(node.arguments[i]); // Await evaluation
            localScope[paramName.toUpperCase()] = argValue; // Store evaluated number
        }

        // Push the new scope onto the stack
        this.scopeStack.push(localScope);
        this.log(`Calling procedure: ${proc.name} with args: [${node.arguments.map(a => this.evaluateExpression(a)).join(', ')}]`); // Log evaluated args

        try {
            // Execute the procedure body within the new scope
            await this.interpretStatements(proc.body);
            // If expectOutput was true but no OutputSignal was thrown, it's an error.
            if (expectOutput) {
                 throw new RuntimeError(`Procedure '${proc.name}' did not OUTPUT a value as expected in expression`, node);
            }
        } catch (error) {
             if (error instanceof OutputSignal) {
                 if (expectOutput) {
                     // Caught the signal, return the value
                     return error.value;
                 } else {
                     // OUTPUT used in a statement context (not expression), which is an error in standard Logo
                     throw new RuntimeError(`OUTPUT command used outside of a procedure call in an expression`, error.node);
                 }
             } else {
                 // Re-throw other runtime errors
                 throw error;
             }
         } finally {
            // Always pop the scope, even if an error occurs
            this.scopeStack.pop();
            this.log(`Finished procedure: ${proc.name}`);
        }
        // If we reach here without error and without outputting, return void
        return;
    }


    private async visitCommand(node: CommandNode): Promise<void> {
        if (!this.turtle) throw new RuntimeError("Turtle not available", node);

        // Evaluate arguments first
        const args = await Promise.all(node.args.map(arg => this.evaluateExpression(arg)));

        // Execute the command
        switch (node.command) {
            case 'FORWARD':
            case 'BACKWARD':
                 if (args.length !== 1) throw new RuntimeError(`${node.command} expects 1 argument, got ${args.length}`, node);
                 if (typeof args[0] !== 'number') throw new RuntimeError(`${node.command} argument must be a number`, node.args[0]);
                 if (node.command === 'FORWARD') this.turtle.forward(args[0]); else this.turtle.backward(args[0]);
                break;
            case 'RIGHT':
            case 'LEFT':
                 if (args.length !== 1) throw new RuntimeError(`${node.command} expects 1 argument, got ${args.length}`, node);
                 if (typeof args[0] !== 'number') throw new RuntimeError(`${node.command} argument must be a number`, node.args[0]);
                 if (node.command === 'RIGHT') this.turtle.right(args[0]); else this.turtle.left(args[0]);
                break;
            case 'PENUP':
            case 'PENDOWN':
            case 'CLEARSCREEN':
            case 'HOME':
                 if (args.length !== 0) throw new RuntimeError(`${node.command} expects 0 arguments, got ${args.length}`, node);
                 if (node.command === 'PENUP') this.turtle.setPenUp();
                 else if (node.command === 'PENDOWN') this.turtle.setPenDown();
                 else if (node.command === 'CLEARSCREEN') this.turtle.reset(); // Use reset to clear state
                 else if (node.command === 'HOME') this.turtle.home();
                break;
            case 'HIDETURTLE':
                if (args.length !== 0) throw new RuntimeError(`${node.command} expects 0 arguments, got ${args.length}`, node);
                this.turtle.hideTurtle();
                break;
            case 'SHOWTURTLE':
                 if (args.length !== 0) throw new RuntimeError(`${node.command} expects 0 arguments, got ${args.length}`, node);
                 this.turtle.showTurtle();
                break;
            case 'SETPENCOLOR':
            case 'SETBACKGROUND':
                 if (args.length !== 3) throw new RuntimeError(`${node.command} expects 3 arguments (r g b), got ${args.length}`, node);
                 if (args.some(a => typeof a !== 'number')) throw new RuntimeError(`${node.command} arguments must be numbers`, node);
                 if (node.command === 'SETPENCOLOR') this.turtle.setPenColor(args[0], args[1], args[2]);
                 else this.turtle.setBackgroundColor(args[0], args[1], args[2]);
                break;
            case 'SETHEADING':
            case 'SETX':
            case 'SETY':
                 if (args.length !== 1) throw new RuntimeError(`${node.command} expects 1 argument, got ${args.length}`, node);
                 if (typeof args[0] !== 'number') throw new RuntimeError(`${node.command} argument must be a number`, node.args[0]);
                 if (node.command === 'SETHEADING') this.turtle.setHeading(args[0]);
                 else if (node.command === 'SETX') this.turtle.setX(args[0]);
                 else if (node.command === 'SETY') this.turtle.setY(args[0]);
                break;
            case 'SETPOS':
                 if (args.length !== 2) throw new RuntimeError(`${node.command} expects 2 arguments (x y), got ${args.length}`, node);
                 if (args.some(a => typeof a !== 'number')) throw new RuntimeError(`${node.command} arguments must be numbers`, node);
                 this.turtle.setPos(args[0], args[1]);
                break;
            case 'WAIT':
                if (args.length !== 1) throw new RuntimeError(`${node.command} expects 1 argument (duration in ms), got ${args.length}`, node);
                if (typeof args[0] !== 'number' || args[0] < 0) throw new RuntimeError(`${node.command} argument must be a non-negative number`, node.args[0]);
                const duration = args[0];
                this.log(`Waiting for ${duration}ms...`);
                await new Promise(resolve => setTimeout(resolve, duration));
                this.log(`Wait finished.`);
                break;
             case 'PRINT':
                 if (args.length !== 1) throw new RuntimeError(`${node.command} expects 1 argument, got ${args.length}`, node);
                 this.log(String(args[0]));
                 break;
            case 'Repeat':
                await this.visitRepeat(node as RepeatNode);
                break;
            case 'ProcedureDefinition':
                this.visitProcedureDefinition(node as ProcedureDefinitionNode);
                break;
            case 'ProcedureCall':
                await this.visitProcedureCall(node as ProcedureCallNode);
                break;
            case 'If':
                await this.visitIf(node as IfNode);
                break;
            case 'Output':
                await this.visitOutput(node as OutputNode);
                break;
            default:
                throw new RuntimeError(`Unknown command encountered during interpretation: '${node.command}'`, node);
        }
    }

    private async visitRepeat(node: RepeatNode): Promise<void> {
        const countValue = await this.evaluateExpression(node.count); // Await here
        if (typeof countValue !== 'number' || !Number.isInteger(countValue) || countValue < 0) {
            throw new RuntimeError(`REPEAT count must evaluate to a non-negative integer, got ${countValue}`, node.count);
        }

        this.log(`Starting REPEAT ${countValue} times.`);
        for (let i = 0; i < countValue; i++) {
             if (this.stopRequested) {
                 this.log("--- Execution Stopped by User (in REPEAT loop) ---");
                 throw new Error("STOP"); // Signal stop
             }
            this.log(`REPEAT iteration ${i + 1}/${countValue}`);
            // Execute the body statements in the current scope
            await this.interpretStatements(node.body); // Await body execution in loop
        }
        this.log(`Finished REPEAT ${countValue} times.`);
    }

    // Added handler for IF statements
    private async visitIf(node: IfNode): Promise<void> {
        const conditionValue = await this.evaluateExpression(node.condition); // Await here
        // Treat non-zero as true, zero as false (common in simple Logo)
        if (conditionValue !== 0) {
            this.log(`IF condition true, executing body.`);
            await this.interpretStatements(node.body);
        } else {
             this.log(`IF condition false, skipping body.`);
        }
    }

    // Added handler for OUTPUT statements
    private async visitOutput(node: OutputNode): Promise<void> { // Make async to await
        // Evaluate the expression to be returned
        const value = await this.evaluateExpression(node.value); // Await here
        this.log(`OUTPUTting value: ${value}`);
        // Throw the custom signal to unwind the stack
        throw new OutputSignal(value, node);
    }


    // --- Expression Evaluation ---

    // Evaluates an expression node and returns its numeric value (now async)
    private async evaluateExpression(node: ASTNode): Promise<number> {
        switch (node.type) {
            case 'Number':
                return (node as NumberNode).value;
            case 'BinaryOp': { // Use block scope for clarity
                const opNode = node as BinaryOpNode;
                // Evaluate operands concurrently? No, standard evaluation is sequential.
                const leftVal = await this.evaluateExpression(opNode.left);
                const rightVal = await this.evaluateExpression(opNode.right);

                switch (opNode.operator) {
                    case '+': return leftVal + rightVal;
                    case '-': return leftVal - rightVal;
                    case '*': return leftVal * rightVal;
                    case '/':
                        if (rightVal === 0) {
                            throw new RuntimeError(`Division by zero`, opNode.right);
                        }
                        return leftVal / rightVal;
                    default:
                        throw new RuntimeError(`Unknown binary operator '${opNode.operator}'`, opNode);
                }
            } // End BinaryOp case block
            case 'Random': {
                const randomNode = node as RandomNode;
                const maxVal = await this.evaluateExpression(randomNode.max); // Await evaluation
                if (typeof maxVal !== 'number' || !Number.isInteger(maxVal) || maxVal <= 0) {
                    throw new RuntimeError(`RANDOM/HASARD argument must evaluate to a positive integer, got ${maxVal}`, randomNode.max);
                }
                // Math.random() gives [0, 1), so multiply by max and floor to get [0, max-1]
                return Math.floor(Math.random() * maxVal);
            } // End Random case block
            case 'Variable': {
                const varNode = node as VariableNode;
                const varNameUpper = varNode.name.toUpperCase();
                // Search scope stack from top (local) down to global
                for (let i = this.scopeStack.length - 1; i >= 0; i--) {
                    const scope = this.scopeStack[i];
                    if (Object.prototype.hasOwnProperty.call(scope, varNameUpper)) {
                        const value = scope[varNameUpper];
                        if (typeof value === 'number') {
                            return value;
                        } else {
                            // This could happen if a procedure name conflicts with a variable name,
                            // though our current structure separates them. Better safe than sorry.
                            throw new RuntimeError(`Symbol '${varNode.name}' is not a variable (it's a procedure)`, node);
                        }
                    }
                }
                throw new RuntimeError(`Undefined variable ':${varNode.name}'`, node);
            } // End Variable case block
            case 'Comparison': { // Added ComparisonNode case
                const compNode = node as ComparisonNode;
                const compLeftVal = await this.evaluateExpression(compNode.left); // Await
                const compRightVal = await this.evaluateExpression(compNode.right); // Await
                let result: boolean;
                switch (compNode.operator) {
                    case '<': result = compLeftVal < compRightVal; break;
                    case '>': result = compLeftVal > compRightVal; break;
                    case '=': result = compLeftVal === compRightVal; break;
                    case '!=': result = compLeftVal !== compRightVal; break; // Added != case
                    default:
                        throw new RuntimeError(`Unknown comparison operator '${compNode.operator}'`, compNode);
                }
                // Return 1 for true, 0 for false (common Logo convention)
                return result ? 1 : 0;
            } // End Comparison case block
             case 'ProcedureCall': { // Added ProcedureCallNode case for expressions
                 const callNode = node as ProcedureCallNode;
                 // Execute the procedure call and expect it might return a value (via OutputSignal)
                 // We modify visitProcedureCall to return the output value if caught.
                 const returnValue = await this.visitProcedureCall(callNode, true); // Pass flag: expect output

                 if (typeof returnValue !== 'number') {
                     // If the procedure didn't output (returned void), it's an error to use it here.
                     throw new RuntimeError(`Procedure '${callNode.name}' did not OUTPUT a value for use in expression`, node);
                 }
                 return returnValue;
            } // End ProcedureCall case block
            // Add cases for other expression types later
            default: {
                 // Exhaustiveness check removed due to persistent TS errors.
                 // Relying on runtime error for unhandled types.
                throw new RuntimeError(`Cannot evaluate unhandled expression type: ${(node as any).type}`, node);
            }
        }
    }
}
