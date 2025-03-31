// lib/logoInterpreter.ts
import { Turtle } from './turtle';
import { tokenize } from './lexer';
import { Parser } from './parser';
import { Program, Statement, Token, TokenType, ASTNode, CommandNode, NumberNode, RepeatNode, ProcedureDefinitionNode, ProcedureCallNode, VariableNode, Expression, RandomNode, BinaryOpNode, IfNode, OutputNode, ComparisonNode } from './types'; // Import necessary types

// Define a structure to hold procedure definitions
interface Procedure {
    parameters: string[];
    body: Statement[];
}

// Define a structure for execution scope (variables)
type Scope = Map<string, number | string | boolean>; // Allow boolean for comparison results

export class LogoInterpreter {
    private turtle: Turtle | null = null;
    private procedures: Map<string, Procedure> = new Map(); // Store defined procedures
    private globalScope: Scope = new Map(); // Global variables
    private executionLog: string[] = []; // Renamed for clarity
    private parseErrors: string[] = []; // Store parse errors separately

    setTurtle(turtle: Turtle) {
        this.turtle = turtle;
    }

    getLog(): string[] {
        return [...this.parseErrors, ...this.executionLog]; // Combine parse and execution logs
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
    private logRuntimeError(message: string, node?: ASTNode): void {
        const location = node ? ` (approx. line ${node.line})` : '';
        const errorMsg = `RUNTIME ERROR: ${message}${location}`;
        console.error(errorMsg);
        // Avoid adding duplicate errors if they bubble up
        if (!this.executionLog.includes(errorMsg)) {
            this.executionLog.push(errorMsg);
        }
        // Optionally re-throw to stop execution immediately
        throw new Error(errorMsg);
    }


    execute(code: string) {
        if (!this.turtle) {
            this.log("ERROR: Turtle not initialized.");
            return;
        }

        // --- Reset State ---
        this.executionLog = [];
        this.parseErrors = [];
        this.procedures = new Map(); // Clear procedures for new execution
        this.globalScope = new Map(); // Clear global scope
        this.log("Starting execution...");
        this.turtle.reset(); // Reset turtle state (position, angle, pen)

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
            // No need to log again, errors are already in parseErrors array
            return; // Stop execution
        }

        // Optional: Log the AST for debugging
        // console.log("AST:", JSON.stringify(programAst, null, 2));
        this.log("Parsing successful. Interpreting AST...");

        // --- Phase 3: Interpretation ---
        try {
            this.interpretProgram(programAst, this.globalScope); // Start interpretation with global scope
            this.log("Execution finished.");
        } catch (error: any) {
            // Catch runtime errors that might have been thrown by logRuntimeError
            // or other unexpected issues during interpretation.
            // logRuntimeError already added the message to the log.
            this.log(`Execution aborted due to runtime error: ${error.message}`);
        }

        // Final redraw after execution completes or aborts
        this.turtle.drawTurtle();
    }

    // --- AST Interpretation Methods ---

    private interpretProgram(program: Program, scope: Scope): void {
        // First pass: Define all procedures globally
        for (const statement of program) {
            if (statement.type === 'ProcedureDefinition') {
                this.defineProcedure(statement);
            }
        }

        // Second pass: Execute top-level statements
        for (const statement of program) {
            // Skip definitions in the execution pass
            if (statement.type !== 'ProcedureDefinition') {
                this.interpretStatement(statement, scope);
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
    private interpretStatement(statement: Statement, scope: Scope): void {
        if (!this.turtle) return; // Should not happen if execute checks first

        switch (statement.type) {
            case 'Command':
                this.executeCommand(statement, scope);
                break;
            case 'ProcedureCall':
                this.executeProcedureCall(statement, scope);
                break;
            case 'Repeat':
                this.executeRepeat(statement, scope);
                break;
            case 'If':
                this.executeIf(statement, scope);
                break;
            case 'Output':
                // OUTPUT is handled within procedure calls, shouldn't be top-level directly usually
                this.logRuntimeError("OUTPUT command used outside of a procedure", statement);
                break;
            case 'ProcedureDefinition':
                // Already handled in the first pass of interpretProgram
                break;
            // Add cases for other statement types (e.g., MAKE for variables)
            default:
                // Use assertion for unexpected node types during development
                const _exhaustiveCheck: never = statement;
                this.logRuntimeError(`Unknown statement type encountered during interpretation: ${(_exhaustiveCheck as any)?.type}`);
        }
    }

    // --- Command Execution ---

    private executeCommand(node: CommandNode, scope: Scope): void {
        if (!this.turtle) return;
        const command = node.command; // Canonical command name (uppercase)
        const args = node.args.map(arg => this.evaluateExpression(arg, scope)); // Evaluate arguments first

        // Helper to validate argument count and types
        const checkArgs = (expectedCount: number, types?: ('number' | 'string' | 'any')[]) => {
            if (args.length !== expectedCount) {
                this.logRuntimeError(`${command} requires ${expectedCount} arguments, got ${args.length}`, node);
            }
            if (types) {
                for (let i = 0; i < expectedCount; i++) {
                    const argType = typeof args[i];
                    const expectedType = types[i];
                    if (expectedType !== 'any' && argType !== expectedType) {
                        this.logRuntimeError(`Argument ${i + 1} for ${command} must be a ${expectedType}, got ${argType}`, node.args[i]);
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
                    this.turtle.forward(args[0] as number);
                    break;
                case 'BK':
                case 'BACKWARD':
                    checkArgs(1, ['number']);
                    this.turtle.backward(args[0] as number);
                    break;
                case 'RT':
                case 'RIGHT':
                    checkArgs(1, ['number']);
                    this.turtle.right(args[0] as number);
                    break;
                case 'LT':
                case 'LEFT':
                    checkArgs(1, ['number']);
                    this.turtle.left(args[0] as number);
                    break;
                case 'PU':
                case 'PENUP':
                    checkArgs(0);
                    this.turtle.penUp();
                    break;
                case 'PD':
                case 'PENDOWN':
                    checkArgs(0);
                    this.turtle.penDown();
                    break;
                case 'CS':
                case 'CLEARSCREEN':
                    checkArgs(0);
                    this.turtle.clearScreen();
                    break;
                case 'HOME':
                    checkArgs(0);
                    this.turtle.home();
                    break;
                case 'SETPC':
                case 'SETPENCOLOR':
                    checkArgs(3, ['number', 'number', 'number']);
                    this.turtle.setPenColor(args[0] as number, args[1] as number, args[2] as number);
                    break;
                // REPEAT, IF, OUTPUT are handled by interpretStatement, not here
                // RANDOM is handled by evaluateExpression
                // TO, END are handled by parsing/definition phase
                default:
                    this.logRuntimeError(`Interpreter logic missing for command "${command}"`, node);
            }
        } catch (error: any) {
            // Catch potential errors from turtle methods themselves
            this.logRuntimeError(`Error during ${command}: ${error.message}`, node);
        }
    }

    // --- Control Structures ---

    private executeRepeat(node: RepeatNode, scope: Scope): void {
        const countValue = this.evaluateExpression(node.count, scope);
        if (typeof countValue !== 'number' || !Number.isInteger(countValue) || countValue < 0) {
            this.logRuntimeError(`REPEAT count must be a non-negative integer, got ${countValue}`, node.count);
            return;
        }

        this.log(`Executing REPEAT ${countValue} times...`);
        for (let i = 0; i < countValue; i++) {
            // Execute body in the current scope
            for (const statement of node.body) {
                this.interpretStatement(statement, scope);
            }
        }
        this.log(`Finished REPEAT block.`);
    }

     private executeIf(node: IfNode, scope: Scope): void {
        const conditionValue = this.evaluateExpression(node.condition, scope);
        // In Logo, often 0 is false, non-zero is true. Let's adopt that.
        // Or handle boolean results from comparisons properly.
        let conditionIsTrue: boolean;
        if (typeof conditionValue === 'boolean') {
            conditionIsTrue = conditionValue;
        } else if (typeof conditionValue === 'number') {
            conditionIsTrue = conditionValue !== 0;
        } else {
             this.logRuntimeError(`IF condition must evaluate to a number or boolean, got ${typeof conditionValue}`, node.condition);
             return;
        }


        this.log(`Executing IF statement (condition: ${conditionValue} -> ${conditionIsTrue})...`);
        if (conditionIsTrue) {
            this.log(`IF condition is true. Executing body...`);
            // Execute body in the current scope
            for (const statement of node.body) {
                this.interpretStatement(statement, scope);
            }
            this.log(`Finished IF body.`);
        } else {
             this.log(`IF condition is false. Skipping body.`);
        }
    }


    // --- Procedure Handling ---

    private executeProcedureCall(node: ProcedureCallNode, currentScope: Scope): void {
        const name = node.name.toUpperCase();
        const procedure = this.procedures.get(name);

        if (!procedure) {
            this.logRuntimeError(`Undefined procedure "${node.name}"`, node);
            return;
        }

        if (node.arguments.length !== procedure.parameters.length) {
            this.logRuntimeError(`Procedure "${node.name}" expects ${procedure.parameters.length} arguments, got ${node.arguments.length}`, node);
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

        // Execute the procedure body within its new scope
        try {
            for (const statement of procedure.body) {
                this.interpretStatement(statement, procedureScope);
                // Check for OUTPUT value? Need a way to return values.
                // This requires modifying interpretStatement and evaluateExpression
                // to handle potential return values, perhaps using exceptions or a dedicated return mechanism.
                // For now, procedures don't return values.
            }
        } catch (error: any) {
             // Catch errors from within the procedure call
             this.logRuntimeError(`Error during procedure "${node.name}": ${error.message}`, node);
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
                    this.logRuntimeError(`Undefined variable ":${expr.name}"`, expr);
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
                this.logRuntimeError(`Procedure calls within expressions not fully supported yet (needs OUTPUT handling)`, expr);
                return 0; // Placeholder
            // Add cases for UnaryOp if implemented differently, etc.
            default:
                 // Use assertion for unexpected node types during development
                const _exhaustiveCheck: never = expr;
                this.logRuntimeError(`Unknown expression type encountered during evaluation: ${(_exhaustiveCheck as any)?.type}`);
                return 0; // Placeholder
        }
    }

    private evaluateBinaryOp(node: BinaryOpNode, scope: Scope): number {
        const left = this.evaluateExpression(node.left, scope);
        const right = this.evaluateExpression(node.right, scope);

        if (typeof left !== 'number' || typeof right !== 'number') {
            this.logRuntimeError(`Arithmetic operations require number operands, got ${typeof left} and ${typeof right}`, node);
            return 0; // Placeholder
        }

        switch (node.operator) {
            case '+': return left + right;
            case '-': return left - right;
            case '*': return left * right;
            case '/':
                if (right === 0) {
                    this.logRuntimeError(`Division by zero`, node);
                    return 0; // Placeholder or Infinity?
                }
                return left / right;
            default:
                this.logRuntimeError(`Unknown binary operator "${node.operator}"`, node);
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
             this.logRuntimeError(`Cannot compare values of different types: ${typeof left} and ${typeof right}`, node);
             return false;
        }

        // Perform comparison based on type
        switch (node.operator) {
            case '<': return left < right;
            case '>': return left > right;
            case '=': return left === right; // Use strict equality
            default:
                this.logRuntimeError(`Unknown comparison operator "${node.operator}"`, node);
                return false;
        }
    }


    private evaluateRandom(node: RandomNode, scope: Scope): number {
        const maxVal = this.evaluateExpression(node.max, scope);
        if (typeof maxVal !== 'number' || !Number.isInteger(maxVal) || maxVal <= 0) {
            this.logRuntimeError(`RANDOM requires a positive integer argument, got ${maxVal}`, node.max);
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
