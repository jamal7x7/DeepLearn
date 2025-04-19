// lib/parser.ts
import {
    Token, TokenType, commandReverseMap, allCommands,
    Program, Statement, ASTNode, CommandNode, NumberNode, RepeatNode,
    ProcedureDefinitionNode, ProcedureCallNode, VariableNode,
    Expression, RandomNode, BinaryOpNode,
    IfNode, OutputNode, ComparisonNode // Added new node types
} from './types';

export class Parser {
    private tokens: Token[];
    private current = 0;
    private logError: (message: string, token: Token | null) => void;

    constructor(
        tokens: Token[],
        logError: (message: string, token: Token | null) => void
    ) {
        // Filter out ERROR tokens before parsing
        this.tokens = tokens.filter(t => t.type !== TokenType.ERROR);
        this.logError = logError;
        if (this.tokens.length === 0 || this.tokens[this.tokens.length - 1].type !== TokenType.EOF) {
            // Ensure there's at least an EOF token
            const lastToken = tokens[tokens.length - 1];
            this.tokens.push({
                type: TokenType.EOF,
                value: 'EOF',
                line: lastToken ? lastToken.line + 1 : 1,
                column: 0
            });
        }
    }

    parse(): Program {
        const statements: Statement[] = [];
        while (!this.isAtEnd()) {
            try {
                statements.push(this.parseStatement());
            } catch (error) {
                if (error instanceof ParseError) {
                    this.logError(error.message, error.token);
                    this.synchronize(); // Attempt to recover and continue parsing
                } else {
                    // Unexpected error
                    this.logError(`Unexpected parsing error: ${error instanceof Error ? error.message : String(error)}`, this.peek());
                    // Stop parsing on unexpected errors as recovery is uncertain
                    break;
                }
            }
        }
        return statements;
    }

    // --- Statement Parsers ---

    private parseStatement(): Statement {
        const token = this.peek();
        switch (token.type) {
            case TokenType.TO:
                return this.parseProcedureDefinition();
            case TokenType.COMMAND:
                const canonicalCommand = commandReverseMap.get(token.value);
                if (canonicalCommand === 'REPEAT') {
                    return this.parseRepeatStatement();
                } else if (canonicalCommand === 'IF') { // Added IF case
                    return this.parseIfStatement();
                } else if (canonicalCommand === 'OUTPUT') { // Added OUTPUT case
                    return this.parseOutputStatement();
                }
                // Fall through for other standard commands handled by parseCommandOrProcedureCall
            case TokenType.WORD: // Could be a procedure call
                // Check if it's a procedure call or potentially an unknown command if not defined yet
                return this.parseCommandOrProcedureCall();
            // Add cases for other statement types like MAKE etc. later
            default:
                this.throwError(`Unexpected token '${token.value}'. Expected command (e.g., FD, REPEAT, IF, OUTPUT), procedure call, or definition start (TO).`, token);
        }
    }

    private parseProcedureDefinition(): ProcedureDefinitionNode {
        const startToken = this.consume(TokenType.TO, "Expected 'TO' to start procedure definition.");
        const nameToken = this.consume(TokenType.WORD, "Expected procedure name after 'TO'.");
        const parameters: string[] = [];
        const body: Statement[] = [];

        // Parse parameters (optional)
        while (this.check(TokenType.COLON)) {
            this.advance(); // Consume ':'
            const paramToken = this.consume(TokenType.WORD, "Expected parameter name after ':'.");
            // Check for duplicate parameters
            if (parameters.includes(paramToken.value)) {
                 this.throwError(`Duplicate parameter name ':${paramToken.value}'`, paramToken);
            }
            parameters.push(paramToken.value);
        }

        // Parse body until 'END'
        while (!this.check(TokenType.END) && !this.isAtEnd()) {
            body.push(this.parseStatement());
        }

        this.consume(TokenType.END, "Expected 'END' to finish procedure definition.");

        return {
            type: 'ProcedureDefinition',
            name: nameToken.value,
            parameters: parameters,
            body: body,
            line: startToken.line,
            column: startToken.column
        };
    }

     private parseRepeatStatement(): RepeatNode {
        const repeatToken = this.consume(TokenType.COMMAND, "Expected 'REPEAT'."); // Consume REPEAT
        const count = this.parseExpression();
        const body = this.parseBlockStatements();

        return {
            type: 'Repeat',
            count: count,
            body: body,
            line: repeatToken.line,
            column: repeatToken.column
        };
    }

    // Added parser for IF statement
    private parseIfStatement(): IfNode {
        const ifToken = this.consume(TokenType.COMMAND, "Expected 'IF' or 'SI'."); // Consume IF/SI
        const condition = this.parseExpression(); // Parse the condition expression
        const body = this.parseBlockStatements(); // Parse the body block

        return {
            type: 'If',
            condition: condition,
            body: body,
            line: ifToken.line,
            column: ifToken.column
            // Note: No ELSE part for now
        };
    }

    // Added parser for OUTPUT statement
    private parseOutputStatement(): OutputNode {
        const outputToken = this.consume(TokenType.COMMAND, "Expected 'OUTPUT' or 'RENVOIE'."); // Consume OUTPUT/RENVOIE
        const value = this.parseExpression(); // Parse the value to be outputted

        // Basic check: OUTPUT should ideally be the last thing in a procedure,
        // but enforcing that strictly here might be complex. The interpreter will handle its effect.

        return {
            type: 'Output',
            value: value,
            line: outputToken.line,
            column: outputToken.column
        };
    }


    private parseCommandOrProcedureCall(): CommandNode | ProcedureCallNode {
        const nameToken = this.advance(); // Consume COMMAND or WORD

        if (nameToken.type !== TokenType.COMMAND && nameToken.type !== TokenType.WORD) {
             this.throwError(`Internal Error: Expected COMMAND or WORD token.`, nameToken);
        }

        const args: Expression[] = [];
        // Argument parsing loop
        while (!this.isAtEnd() &&
               !this.check(TokenType.TO) &&
               !this.check(TokenType.END) &&
               !this.check(TokenType.RBRACKET))
        {
            const currentToken = this.peek();
            const nextToken = this.peekNext(); // Look ahead

            // Special Check: Handle '-NUMBER' sequence directly as a negative literal argument
            if (currentToken.type === TokenType.OPERATOR && currentToken.value === '-' &&
                nextToken.type === TokenType.NUMBER)
            {
                this.advance(); // Consume '-'
                const numberToken = this.advance(); // Consume NUMBER
                const value = parseFloat(numberToken.value);
                if (isNaN(value)) { // Should not happen if lexer is correct, but good check
                     this.throwError(`Invalid number format '${numberToken.value}' after '-'`, numberToken);
                }
                // Create NumberNode with negative value
                args.push({
                    type: 'Number',
                    value: -value, // Apply the negation
                    line: currentToken.line, // Use line/col of the '-'
                    column: currentToken.column
                });
                continue; // Move to next iteration of the argument loop
            }

            // Original Check: Check if the current token can start a valid expression factor
            const canStartExpression =
                currentToken.type === TokenType.NUMBER ||
                currentToken.type === TokenType.COLON ||
                currentToken.type === TokenType.LPAREN ||
                // Keep unary minus check here for cases like 'PRINT -:x' or 'PRINT -(5+2)'
                (currentToken.type === TokenType.OPERATOR && currentToken.value === '-') ||
                (currentToken.type === TokenType.COMMAND && commandReverseMap.get(currentToken.value) === 'RANDOM') ||
                 // Allow procedure calls that return values as arguments
                currentToken.type === TokenType.WORD;


            if (canStartExpression) {
                try {
                    // Attempt to parse a full expression (handles variables, +, *, function calls etc.)
                    args.push(this.parseExpression());
                } catch (error) {
                    // If parsing fails mid-argument list, break
                     break;
                }
            } else {
                // If the token cannot start an expression, assume end of arguments.
                break;
            }
        } // End of argument parsing loop

        if (nameToken.type === TokenType.COMMAND) {
            const canonicalCommand = commandReverseMap.get(nameToken.value);
            if (!canonicalCommand) {
                 this.throwError(`Internal Error: Unknown canonical command for '${nameToken.value}'`, nameToken);
            }
            // Basic arity check could be added here based on canonicalCommand
            return {
                type: 'Command',
                command: canonicalCommand,
                args: args,
                line: nameToken.line,
                column: nameToken.column
            };
        } else { // It's a WORD, so treat as ProcedureCall
            return {
                type: 'ProcedureCall',
                name: nameToken.value,
                arguments: args,
                line: nameToken.line,
                column: nameToken.column
            };
        }
    }

    // Parses a block of statements enclosed in [ ... ]
    private parseBlockStatements(): Statement[] {
        this.consume(TokenType.LBRACKET, `Expected '[' to start block`);
        const statements: Statement[] = [];
        while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
            statements.push(this.parseStatement());
        }
        this.consume(TokenType.RBRACKET, `Expected ']' to end block`);
        return statements;
    }

    // --- Expression Parsers (using precedence climbing / Pratt parsing idea) ---
    // New hierarchy: expression -> comparison -> term -> factor -> unary -> primary

    // expression (entry point) ::= comparison
    private parseExpression(): Expression {
        return this.parseComparison();
    }

    // comparison ::= term ( ( '>' | '<' | '=' ) term )*
    private parseComparison(): Expression {
        let expr = this.parseTerm(); // Parse the left-hand side (addition/subtraction level)

        while (this.check(TokenType.COMPARISON_OPERATOR)) {
            const operatorToken = this.advance(); // Consume the comparison operator
            const right = this.parseTerm(); // Parse the right-hand side
            expr = {
                type: 'Comparison',
                operator: operatorToken.value,
                left: expr,
                right: right,
                line: operatorToken.line,
                column: operatorToken.column
            };
        }
        return expr;
    }


    // term (addition/subtraction) ::= factor ( ( '+' | '-' ) factor )*
    // Renamed from original parseExpression
    private parseTerm(): Expression {
        let expr = this.parseFactor(); // Parse the left-hand side (multiplication/division level)

        while (this.match(TokenType.OPERATOR, '+') || this.match(TokenType.OPERATOR, '-')) {
            const operatorToken = this.previous();
            const right = this.parseFactor(); // Parse the right-hand side
            expr = {
                type: 'BinaryOp', // Still BinaryOp, just lower precedence now
                operator: operatorToken.value,
                left: expr,
                right: right,
                line: operatorToken.line, // Use operator token for location
                column: operatorToken.column
            };
        }
        return expr;
    }

    // factor (multiplication/division) ::= unary ( ( '*' | '/' ) unary )*
    // Renamed from original parseTerm
    private parseFactor(): Expression {
        let expr = this.parseUnary(); // Parse the left-hand side (unary level)

        while (this.match(TokenType.OPERATOR, '*') || this.match(TokenType.OPERATOR, '/')) {
            const operatorToken = this.previous();
            const right = this.parseUnary(); // Parse the right-hand side
            expr = {
                type: 'BinaryOp', // Still BinaryOp
                operator: operatorToken.value,
                left: expr,
                right: right,
                line: operatorToken.line,
                column: operatorToken.column
            };
        }
        return expr;
    }

    // unary ::= ( '-' ) unary | primary
    // Renamed from original parseFactor, handles unary minus
    private parseUnary(): Expression {
        if (this.match(TokenType.OPERATOR, '-')) {
            const operatorToken = this.previous();
            const right = this.parseUnary(); // Parse the operand recursively
            // Represent unary minus as 0 - operand for simplicity in evaluation
            const zeroNode: NumberNode = { type: 'Number', value: 0, line: operatorToken.line, column: operatorToken.column };
            return {
                type: 'BinaryOp',
                operator: '-',
                left: zeroNode,
                right: right,
                line: operatorToken.line,
                column: operatorToken.column
            };
        }
        return this.parsePrimary(); // Otherwise, parse the primary expression
    }

    // primary ::= NUMBER | ':' WORD | COMMAND factor | '(' expression ')'
    // Handles literals, variables, RANDOM calls, and parentheses.
    // Procedure calls used as statements are handled by parseStatement/parseCommandOrProcedureCall.
    // Procedure calls returning values (reporters) would need different handling if added later.
    private parsePrimary(): Expression {
         if (this.check(TokenType.NUMBER)) {
            return this.parseNumberNode();
        } else if (this.check(TokenType.COLON)) {
            return this.parseVariableNode();
        } else if (this.check(TokenType.COMMAND)) {
            const commandToken = this.peek();
            const canonicalCommand = commandReverseMap.get(commandToken.value);
            // Only allow specific commands that act like functions (e.g., RANDOM) in expressions
            if (canonicalCommand === 'RANDOM') {
                 return this.parseRandomNode();
            } else {
                 this.throwError(`Command '${commandToken.value}' cannot be used directly in an expression here.`, commandToken);
            }
        } else if (this.match(TokenType.LPAREN)) {
            const expr = this.parseExpression(); // Parse expression within parentheses
            this.consume(TokenType.RPAREN, "Expected ')' after expression in parentheses.");
            return expr;
        } else {
            this.throwError(`Expected number, variable, function call (like RANDOM), or '(' to start an expression`, this.peek()); // Updated error message slightly
        }
    }


    // RANDOM now parses its argument as a unary expression (or higher precedence)
    private parseRandomNode(): RandomNode {
        const randomToken = this.consume(TokenType.COMMAND, "Expected 'RANDOM' or 'HASARD'.");
        // RANDOM expects one argument: the maximum value
        const maxExpression = this.parseUnary(); // Parse argument with higher precedence
        return {
            type: 'Random',
            max: maxExpression,
            line: randomToken.line,
            column: randomToken.column
        };
    }

    // This function might now be unused or only needed if you re-introduce reporters later.
    // For now, standard procedure calls won't reach here via parsePrimary.
    private parseProcedureCallExpression(): ProcedureCallNode {
        const nameToken = this.consume(TokenType.WORD, "Expected procedure name for function call in expression.");

        const args: Expression[] = [];
        // Keep parsing arguments as long as they look like they could start an expression
        // This is simpler than the statement-level one as we expect expressions here.
        // Stop before tokens that clearly end the argument list in this context.
        while (!this.isAtEnd() &&
               !this.check(TokenType.RBRACKET) && // Stop at block end
               !this.check(TokenType.RPAREN) && // Stop at parenthesis end
               !this.check(TokenType.OPERATOR) && // Stop before next arithmetic operator
               !this.check(TokenType.COMPARISON_OPERATOR) // Stop before comparison operator
               )
        {
             // Check if the current token can start a valid expression primary
             const currentToken = this.peek();
             const canStartPrimary =
                 currentToken.type === TokenType.NUMBER ||
                 currentToken.type === TokenType.COLON ||
                 currentToken.type === TokenType.LPAREN ||
                 (currentToken.type === TokenType.OPERATOR && currentToken.value === '-') || // Unary minus
                 (currentToken.type === TokenType.COMMAND && commandReverseMap.get(currentToken.value) === 'RANDOM') ||
                 currentToken.type === TokenType.WORD; // Allow nested function calls

             if (canStartPrimary) {
                 try {
                     // Attempt to parse a full expression for the argument
                     args.push(this.parseExpression());
                 } catch (error) {
                     // If parsing fails mid-argument list, break
                     break;
                 }
             } else {
                 // If the token cannot start an expression, assume end of arguments.
                 break;
             }
        }

        return {
            type: 'ProcedureCall',
            name: nameToken.value,
            arguments: args,
            line: nameToken.line,
            column: nameToken.column
        };
    }


    private parseNumberNode(): NumberNode {
        const token = this.consume(TokenType.NUMBER, `Expected a number.`);
        const value = parseFloat(token.value);
        if (isNaN(value)) {
            this.throwError(`Invalid number format '${token.value}'.`, token);
        }
        return { type: 'Number', value: value, line: token.line, column: token.column };
    }

     private parseVariableNode(): VariableNode {
        const colonToken = this.consume(TokenType.COLON, `Expected ':' for variable/parameter reference.`);
        const nameToken = this.consume(TokenType.WORD, `Expected variable/parameter name after ':'.`);
        return { type: 'Variable', name: nameToken.value, line: colonToken.line, column: colonToken.column };
    }


    // --- Parser Control & Error Handling ---

    // Checks if the current token is of the expected type and optionally matches a specific value. Consumes the token if it matches.
    private match(type: TokenType, value?: string): boolean {
        if (this.check(type)) {
            if (value === undefined || this.peek().value === value) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    private peek(): Token {
        return this.tokens[this.current];
    }

    // Add a helper to look at the token after the current one
    private peekNext(): Token {
        if (this.current + 1 >= this.tokens.length) {
            // Return EOF if we're at the end
            return this.tokens[this.tokens.length - 1];
        }
        return this.tokens[this.current + 1];
    }

    private previous(): Token {
        return this.tokens[this.current - 1];
    }

    private isAtEnd(): boolean {
        return this.peek().type === TokenType.EOF;
    }

    private advance(): Token {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    private check(type: TokenType): boolean {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    private consume(type: TokenType, errorMessage: string): Token {
        if (this.check(type)) return this.advance();
        this.throwError(errorMessage, this.peek());
    }

    // Basic synchronization: Advance until we find a token that might start a new statement,
    // or the end of the file. This helps continue parsing after an error.
    private synchronize(): void {
        this.advance(); // Consume the token that caused the error

        while (!this.isAtEnd()) {
            // If the previous token was END, maybe we are at a good recovery point
            if (this.previous().type === TokenType.END) return;

            // Check if the current token could start a new statement
            switch (this.peek().type) {
                case TokenType.TO:
                case TokenType.COMMAND:
                case TokenType.WORD: // Could be a procedure call
                // Add other statement starting tokens here (e.g., IF)
                    return;
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
        const location = token ? ` at line ${token.line}, col ${token.column}` : '';
        // Ensure message ends with a period if it doesn't already.
        const formattedMessage = message.endsWith('.') ? message : message + '.';
        super(`${formattedMessage}${location}`);
        this.name = "ParseError";
        this.token = token;
    }
}
