// lib/lexer.ts
import { TokenType, Token, allCommands } from './types';

export function tokenize(code: string): Token[] {
    const tokens: Token[] = [];
    const lines = code.split('\n');
    const commandRegex = /^[A-Za-z]+$/; // Simple command word check
    const numberRegex = /^-?\d+(\.\d+)?$/; // Integer or float

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];
        let currentColumn = 0;

        // Basic comment removal (simple version: ignores comments after commands on same line)
        const commentStart = line.indexOf(';');
        const effectiveLine = commentStart !== -1 ? line.substring(0, commentStart).trim() : line.trim();

        if (effectiveLine === '') continue;

        // Split by spaces, but keep brackets as separate tokens
        const parts = effectiveLine.split(/(\[|\]|\s+)/).filter(p => p && p.trim() !== '');

        for (const part of parts) {
            const upperPart = part.toUpperCase();
            let type: TokenType | null = null;
            let value = part;
            const startColumn = line.indexOf(part, currentColumn); // Approximate column

            if (numberRegex.test(part)) {
                type = TokenType.NUMBER;
            } else if (part === '[') {
                type = TokenType.LBRACKET;
            } else if (part === ']') {
                type = TokenType.RBRACKET;
            } else if (allCommands.has(upperPart)) {
                type = TokenType.COMMAND;
                value = upperPart; // Standardize command tokens to uppercase
            } else {
                 // If it's not a known command, number or bracket, treat as error for now
                 // A full implementation would handle variables, strings etc.
                 console.warn(`Lexer: Unknown token '${part}' on line ${lineNum + 1}`);
                 // You could push an ERROR token or just skip/ignore
                 // tokens.push({ type: TokenType.ERROR, value: `Unknown token: ${part}`, line: lineNum + 1, column: startColumn });
                 // For simplicity, we'll currently ignore unknown words
                 currentColumn = startColumn + part.length;
                 continue;
            }

            if (type) {
                 tokens.push({ type, value, line: lineNum + 1, column: startColumn });
            }
             currentColumn = startColumn + part.length;
        }
    }

    tokens.push({ type: TokenType.EOF, value: 'EOF', line: lines.length + 1, column: 0 });
    return tokens;
}