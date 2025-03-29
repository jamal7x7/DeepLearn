// lib/parser.ts
import { Token, TokenType, commandReverseMap } from './types';
import { Turtle } from './turtle';

// Type for command execution functions
type CommandExecutor = (parser: Parser) => void;

export class Parser {
    private tokens: Token[];
    private current: number = 0;
    private turtle: Turtle;
    private commandHandlers: Map<string, CommandExecutor>;
    private logError: (message: string, token: Token | null) => void;
    private logInfo: (message: string) => void;

    constructor(
        tokens: Token[],
        turtle: Turtle,
        commandHandlers: Map<string, CommandExecutor>,
        logError: (message: string, token: Token | null) => void,
        logInfo: (message: string) => void
    ) {
        this.tokens = tokens;
        this.turtle = turtle;
        this.commandHandlers = commandHandlers;
        this.logError = logError;
        this.logInfo = logInfo;
    }

    parse(): void {
        this.logInfo("Parser started.");
        while (!this.isAtEnd()) {
            try {
                this.parseCommand();
            } catch (error) {
                if (error instanceof ParseError) {
                    this.logError(error.message, error.token);
                    // Simple recovery: skip to next potential command start or end of input
                    // A more robust parser would try synchronizing better.
                    this.advanceUntilRecovery();
                } else {
                    // Unexpected error
                    this.logError(`Unexpected error: ${error.message}`, this.peek());
                    break; // Stop parsing on unexpected errors
                }
            }
        }
         this.logInfo("Parser finished.");
    }

    private parseCommand(): void {
        if (this.peek().type !== TokenType.COMMAND) {
            this.throwError(`Expected command`, this.peek());
        }

        const commandToken = this.advance();
        const canonicalCommand = commandReverseMap.get(commandToken.value); // Use canonical name for handler lookup

        if (!canonicalCommand) {
             // Should not happen if lexer only creates COMMAND for known ones, but check anyway
             this.throwError(`Unknown command '${commandToken.value}'`, commandToken);
        }


        const handler = this.commandHandlers.get(canonicalCommand);
        if (!handler) {
            this.throwError(`No handler defined for command '${canonicalCommand}'`, commandToken);
        }

        this.logInfo(`Executing: ${commandToken.value} (Canonical: ${canonicalCommand})`);
        handler(this); // Execute the command's logic
    }

    // --- Argument Parsers ---

    parseNumber(): number {
        if (this.peek().type !== TokenType.NUMBER) {
            this.throwError(`Expected a number`, this.peek());
        }
        const token = this.advance();
        const value = parseFloat(token.value);
        if (isNaN(value)) {
             // Should be caught by lexer regex, but double check
            this.throwError(`Invalid number format '${token.value}'`, token);
        }
        return value;
    }

    // Parses a block of commands enclosed in [ ... ]
    // Returns a list of tokens representing the block's content
    parseBlockTokens(): Token[] {
        this.consume(TokenType.LBRACKET, `Expected '[' to start block`);

        const blockTokens: Token[] = [];
        let bracketLevel = 1;

        while (bracketLevel > 0 && !this.isAtEnd()) {
            const token = this.peek();
            if (token.type === TokenType.LBRACKET) {
                bracketLevel++;
            } else if (token.type === TokenType.RBRACKET) {
                bracketLevel--;
            }

            if (bracketLevel > 0) {
                blockTokens.push(this.advance());
            } else {
                 // Don't add the final ']' to the block's tokens
                 this.consume(TokenType.RBRACKET, `Expected ']' to end block`);
            }
        }

        if (bracketLevel > 0) {
            this.throwError(`Unmatched '[' - block not closed`, this.previous()); // Error at last token seen
        }

        return blockTokens;
    }


    // --- Parser Control ---

    peek(): Token {
        return this.tokens[this.current];
    }

    previous(): Token {
        return this.tokens[this.current - 1];
    }

    isAtEnd(): boolean {
        return this.peek().type === TokenType.EOF;
    }

    advance(): Token {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    check(type: TokenType): boolean {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    consume(type: TokenType, errorMessage: string): Token {
        if (this.check(type)) return this.advance();
        this.throwError(errorMessage, this.peek());
        // This line won't be reached due to throwError, but TS needs it
        return this.peek(); // Should be unreachable
    }

    // Simple error recovery: advance until a potential command or EOF
    private advanceUntilRecovery(): void {
        while (!this.isAtEnd()) {
            const tokenType = this.peek().type;
             if (tokenType === TokenType.COMMAND || tokenType === TokenType.EOF) {
                return; // Found potential start of next command or end
            }
            this.advance();
        }
    }

    private throwError(message: string, token: Token | null): never {
         throw new ParseError(message, token);
    }
}

// Custom error class to hold token info
class ParseError extends Error {
    token: Token | null;
    constructor(message: string, token: Token | null) {
        const lineInfo = token ? ` on line ${token.line}` : '';
        super(`${message}${lineInfo}.`);
        this.name = "ParseError";
        this.token = token;
    }
}