// lib/interpreter.ts
import { Turtle } from './turtle';
import { tokenize } from './lexer';
import { Parser } from './parser';
import { Token, TokenType } from './types'; // Keep Token type if needed for errors

export class LogoInterpreter {
    private turtle: Turtle | null = null;
    private commandLog: string[] = [];
    private commandHandlers: Map<string, (parser: Parser) => void>; // Map canonical EN name to handler

    constructor() {
        this.commandHandlers = this.buildCommandHandlers();
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

    private logError(message: string, token: Token | null = null) {
        const context = token ? ` (near token '${token.value}' line ${token.line})` : '';
        const errorMsg = `ERROR: ${message}${context}`;
        console.error(errorMsg);
        this.commandLog.push(errorMsg);
    }

    // Define handlers for each canonical command name
    private buildCommandHandlers(): Map<string, (parser: Parser) => void> {
        const handlers = new Map<string, (parser: Parser) => void>();

        handlers.set('FORWARD', (parser) => {
            const distance = parser.parseNumber();
            this.turtle?.forward(distance);
        });
        handlers.set('BACKWARD', (parser) => {
            const distance = parser.parseNumber();
            this.turtle?.backward(distance);
        });
         handlers.set('RIGHT', (parser) => {
            const degrees = parser.parseNumber();
            this.turtle?.right(degrees);
        });
         handlers.set('LEFT', (parser) => {
            const degrees = parser.parseNumber();
            this.turtle?.left(degrees);
        });
         handlers.set('PENUP', (parser) => {
            this.turtle?.penUp();
        });
         handlers.set('PENDOWN', (parser) => {
            this.turtle?.penDown();
        });
         handlers.set('CLEARSCREEN', (parser) => {
            this.turtle?.clearScreen();
        });
         handlers.set('HOME', (parser) => {
            this.turtle?.home();
        });
        handlers.set('SETPENCOLOR', (parser) => {
            const r = parser.parseNumber();
            const g = parser.parseNumber();
            const b = parser.parseNumber();
            this.turtle?.setPenColor(r, g, b);
        });
         handlers.set('SETHEADING', (parser) => {
            const angle = parser.parseNumber();
            this.turtle?.setHeading(angle);
        });
         handlers.set('SETX', (parser) => {
            const x = parser.parseNumber();
            this.turtle?.setX(x);
        });
         handlers.set('SETY', (parser) => {
            const y = parser.parseNumber();
            this.turtle?.setY(y);
        });
         handlers.set('SETPOS', (parser) => {
            const x = parser.parseNumber();
            const y = parser.parseNumber();
            this.turtle?.setPos(x, y);
        });
        handlers.set('SETBACKGROUND', (parser) => {
            const r = parser.parseNumber();
            const g = parser.parseNumber();
            const b = parser.parseNumber();
            this.turtle?.setBackgroundColor(r, g, b);
        });

        // --- REPEAT Command ---
        handlers.set('REPEAT', (parser) => {
            if (!this.turtle) return; // Should not happen if checked before execute

            const countToken = parser.peek(); // Peek to get token info for errors
            const count = parser.parseNumber();
            if (!Number.isInteger(count) || count < 0) {
                 // Use the parser's error mechanism
                 throw new Error(`REPEAT count must be a non-negative integer, got ${count}`); // Or use parser.throwError if integrated
                // this.logError(`REPEAT count must be a non-negative integer, got ${count}`, countToken);
                // Need a way to gracefully recover in parser if needed
                // return;
            }

            const blockTokens = parser.parseBlockTokens(); // Get tokens for the block [ ... ]

            this.log(`Starting REPEAT ${count} times.`);
            // Execute the block 'count' times
            for (let i = 0; i < count; i++) {
                 this.log(`REPEAT iteration ${i + 1}/${count}`);
                 // Create a new parser instance for the block execution
                 // This ensures correct state management (e.g., current token index)
                 // for nested repeats or procedures later.
                 const blockParser = new Parser(
                    [...blockTokens, { type: TokenType.EOF, value: 'EOF', line: -1, column: -1 }], // Add EOF marker
                    this.turtle,
                    this.commandHandlers, // Pass the same handlers down
                    (msg, token) => this.logError(msg, token), // Use current error logger
                    (msg) => this.log(msg) // Use current info logger
                 );
                 blockParser.parse(); // Parse and execute the commands within the block
                 // Check for errors within the block? The logger should have captured them.
            }
            this.log(`Finished REPEAT ${count} times.`);
        });


        return handlers;
    }


    execute(code: string) {
        if (!this.turtle) {
            this.logError("Turtle not initialized.");
            return;
        }

        this.commandLog = []; // Clear log for new execution
        this.log("--- Execution Start ---");

        // 1. Tokenize
        const tokens = tokenize(code);
        this.log(`Tokens: ${tokens.map(t => t.value).join(' ')}`); // Log tokens for debugging

        // Check for lexer errors (if lexer generated any)
        const lexerErrors = tokens.filter(t => t.type === TokenType.ERROR);
        if (lexerErrors.length > 0) {
            lexerErrors.forEach(err => this.logError(err.value, err));
            this.log("--- Execution Aborted (Lexer Errors) ---");
            return;
        }


        // 2. Parse & Execute
        const parser = new Parser(
            tokens,
            this.turtle,
            this.commandHandlers,
            (msg, token) => this.logError(msg, token), // Lambda ensures 'this' is correct
            (msg) => this.log(msg)
        );

        // Clear canvas *before* parsing/execution starts
        this.turtle.clearScreen(); // Clear existing drawings

        parser.parse(); // This now drives the execution via command handlers

        // 3. Final Touches (e.g., draw turtle icon)
        this.turtle.drawTurtle(); // Draw the turtle at its final position

        this.log("--- Execution Finished ---");
    }
}

// Re-export necessary types if they are only used here and in page.tsx
// export { Turtle }; // Turtle is likely used in page.tsx