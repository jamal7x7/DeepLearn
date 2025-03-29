// lib/logoInterpreter.ts
import { Turtle } from './turtle';

export class LogoInterpreter {
    private turtle: Turtle | null = null;
    private commandLog: string[] = []; // To store execution steps/errors

    setTurtle(turtle: Turtle) {
        this.turtle = turtle;
    }

    getLog(): string[] {
        return this.commandLog;
    }

    private log(message: string) {
        console.log(`Interpreter: ${message}`);
        this.commandLog.push(message);
    }

    private logError(message: string, lineNum: number, line: string) {
        const errorMsg = `ERROR Line ${lineNum + 1}: ${message} (in "${line}")`;
        console.error(errorMsg);
        this.commandLog.push(errorMsg);
    }


    execute(code: string) {
        if (!this.turtle) {
            this.log("ERROR: Turtle not initialized.");
            return;
        }

        this.commandLog = []; // Clear log for new execution
        this.log("Starting execution...");

        // Basic parsing: split by lines, then by spaces, ignore empty lines/comments
        const lines = code.split('\n');

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();

            // Basic comment handling (lines starting with ';')
            if (line.startsWith(';') || line === '') {
                continue;
            }

            // Convert to uppercase for case-insensitivity, split into tokens
            const tokens = line.toUpperCase().split(/\s+/);
            const command = tokens[0];
            const args = tokens.slice(1);

            this.log(`Executing: ${line}`);

            try {
                switch (command) {
                    case 'FD':
                    case 'FORWARD':
                        if (args.length !== 1 || isNaN(Number(args[0]))) {
                            this.logError(`FORWARD requires 1 numeric argument.`, i, line);
                            continue;
                        }
                        this.turtle.forward(Number(args[0]));
                        break;

                    case 'BK':
                    case 'BACKWARD':
                         if (args.length !== 1 || isNaN(Number(args[0]))) {
                            this.logError(`BACKWARD requires 1 numeric argument.`, i, line);
                            continue;
                        }
                        this.turtle.backward(Number(args[0]));
                        break;

                    case 'RT':
                    case 'RIGHT':
                         if (args.length !== 1 || isNaN(Number(args[0]))) {
                            this.logError(`RIGHT requires 1 numeric argument.`, i, line);
                            continue;
                        }
                        this.turtle.right(Number(args[0]));
                        break;

                    case 'LT':
                    case 'LEFT':
                        if (args.length !== 1 || isNaN(Number(args[0]))) {
                           this.logError(`LEFT requires 1 numeric argument.`, i, line);
                           continue;
                       }
                        this.turtle.left(Number(args[0]));
                        break;

                    case 'PU':
                    case 'PENUP':
                        if (args.length !== 0) {
                            this.logError(`PENUP takes no arguments.`, i, line);
                            continue;
                        }
                        this.turtle.penUp();
                        break;

                    case 'PD':
                    case 'PENDOWN':
                         if (args.length !== 0) {
                            this.logError(`PENDOWN takes no arguments.`, i, line);
                            continue;
                        }
                        this.turtle.penDown();
                        break;

                    case 'CS':
                    case 'CLEARSCREEN':
                        if (args.length !== 0) {
                            this.logError(`CLEARSCREEN takes no arguments.`, i, line);
                            continue;
                        }
                        this.turtle.clearScreen();
                        break;

                    case 'HOME':
                         if (args.length !== 0) {
                            this.logError(`HOME takes no arguments.`, i, line);
                            continue;
                        }
                        this.turtle.home();
                        break;

                     // Example: Add SETPC (Set Pen Color)
                    // Usage: SETPC R G B (e.g., SETPC 255 0 0 for red)
                    case 'SETPC':
                    case 'SETPENCOLOR':
                        if (args.length !== 3 || args.some(isNaN)) {
                           this.logError(`SETPC requires 3 numeric arguments (R G B).`, i, line);
                           continue;
                        }
                        this.turtle.setPenColor(Number(args[0]), Number(args[1]), Number(args[2]));
                        break;


                    // --- Add more commands here (REPEAT, TO, etc.) ---

                    default:
                        this.logError(`Unknown command "${command}"`, i, line);
                }
            } catch (error: any) {
                 this.logError(`Runtime error during "${command}": ${error.message}`, i, line);
            }

            // Optional: Redraw the turtle icon after each command if you want to see it move
            // this.turtle.clearScreen(); // Need to redraw everything if you do this
            // this.turtle.drawTurtle();
        }
        this.log("Execution finished.");
    }
}

// Helper to check if a value is a number (used by some commands)
function isNaN(value: any): boolean {
    return Number.isNaN(Number(value));
}