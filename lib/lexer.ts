// lib/lexer.ts
import { TokenType, Token, allCommands, commandReverseMap, allKeywords, keywordReverseMap } from './types';

const OPERATORS = new Set(['+', '-', '*', '/']);
const COMPARISON_OPERATORS = new Set(['<', '>', '=', '!=']); // Ensure this contains the string '!='

export function tokenize(code: string): Token[] {
    const tokens: Token[] = [];
    const lines = code.split(/[\r\n]+/); // Handle different line endings
    const numberRegex = /^-?\d+(\.\d+)?$/; // Integer or float
    const identifierRegex = /^[A-Za-z_][A-Za-z0-9_]*$/; // Basic identifier (for WORD)

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        let line = lines[lineNum];
        const currentColumn = 1; // Start column at 1 for user-friendliness

        // Basic comment removal
        const commentStart = line.indexOf(';');
        if (commentStart !== -1) {
            line = line.substring(0, commentStart);
        }
        line = line.trimEnd(); // Keep leading spaces for column calculation

        // Split considering spaces, brackets, colons, parentheses, and operators (arithmetic & comparison) as delimiters/tokens
        // Regex: Keep delimiters `[]:()+-*/<=>`, split by whitespace `\s+`
        // Need to be careful with multi-character operators if added later (e.g., <=, >=, !=)
        const parts = line.split(/(\[|\]|:|\(|\)|\+|-|\*|\/|!=|<|>|=|\s+)/).filter(p => p); // Added != to split regex

        let effectiveColumn = currentColumn; // Track column accurately

        for (const part of parts) {
            const startColumn = effectiveColumn; // Column where this part starts

            if (part.trim() === '') {
                // This is whitespace, just advance the column counter
                effectiveColumn += part.length;
                continue;
            }

            const trimmedPart = part.trim(); // Use trimmed part for checks, original for length
            const upperPart = trimmedPart.toUpperCase();
            let type: TokenType | null = null;
            let value = trimmedPart;

            if (numberRegex.test(trimmedPart)) {
                type = TokenType.NUMBER;
            } else if (trimmedPart === '[') {
                type = TokenType.LBRACKET;
            } else if (trimmedPart === ']') {
                type = TokenType.RBRACKET;
            } else if (trimmedPart === ':') {
                type = TokenType.COLON;
            } else if (trimmedPart === '(') {
                type = TokenType.LPAREN;
            } else if (trimmedPart === ')') {
                type = TokenType.RPAREN;
            } else if (OPERATORS.has(trimmedPart)) {
                type = TokenType.OPERATOR;
                value = trimmedPart; // Keep the specific operator (+, -, *, /)
            } else if (COMPARISON_OPERATORS.has(trimmedPart)) { // Check for comparison operators
                type = TokenType.COMPARISON_OPERATOR;
                value = trimmedPart; // Keep the specific operator (<, >, =, !=)
            // Check for general keywords (TO/POUR, END/FIN) first
            } else if (allKeywords.has(upperPart)) {
                const canonicalKeyword = keywordReverseMap.get(upperPart);
                if (canonicalKeyword === 'TO') {
                    type = TokenType.TO;
                } else if (canonicalKeyword === 'END') {
                    type = TokenType.END;
                }
                // Add other keyword checks (IF/SI etc.) here if needed
                value = upperPart; // Keep the original alias as the value for logging/debugging? Or canonical? Let's use canonical for consistency.
                value = canonicalKeyword!; // Use the canonical keyword (TO/END) as the value
            } else if (allCommands.has(upperPart)) { // Check for commands (FD, RT, REPEAT etc.)
                type = TokenType.COMMAND;
                value = upperPart; // Standardize command tokens to uppercase
            } else if (identifierRegex.test(trimmedPart)) { // Check for procedure/variable names
                // Check if it's a valid identifier (potential procedure name or variable)
                type = TokenType.WORD;
                // Keep original casing for WORDs, might be important later
                value = trimmedPart;
            } else {
                // If it's none of the above, it's an error
                console.error(`Lexer Error: Unknown token '${trimmedPart}' on line ${lineNum + 1}, column ${startColumn}`);
                type = TokenType.ERROR;
                value = `Unknown token: ${trimmedPart}`;
            }

            if (type) {
                 tokens.push({ type, value, line: lineNum + 1, column: startColumn });
            }
            effectiveColumn += part.length; // Advance column by original part length (incl. spaces if any)
        }
    }

    tokens.push({ type: TokenType.EOF, value: 'EOF', line: lines.length + 1, column: 0 });
    return tokens;
}
