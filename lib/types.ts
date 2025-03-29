// lib/types.ts

export enum TokenType {
    COMMAND = 'COMMAND',
    NUMBER = 'NUMBER',
    LBRACKET = 'LBRACKET', // [
    RBRACKET = 'RBRACKET', // ]
    // Add WORD, VARIABLE, OPERATOR etc. for future extensions
    EOF = 'EOF', // End of File/Input
    ERROR = 'ERROR', // For tokenization errors
}

export interface Token {
    type: TokenType;
    value: string;
    line: number; // Line number for error reporting
    column: number; // Column number for error reporting
}

// Map English command names to their aliases (including French)
// Key is the canonical English command name (used internally)
export const commandAliases: { [key: string]: string[] } = {
    FORWARD: ['FORWARD', 'FD', 'AVANT', 'AV'],
    BACKWARD: ['BACKWARD', 'BK', 'RECULE', 'RE'],
    RIGHT: ['RIGHT', 'RT', 'DROITE', 'TD'], // Tourne Droite
    LEFT: ['LEFT', 'LT', 'GAUCHE', 'TG'],   // Tourne Gauche
    PENUP: ['PENUP', 'PU', 'LEVECRAYON', 'LC'],
    PENDOWN: ['PENDOWN', 'PD', 'BAISSECRAYON', 'BC'],
    CLEARSCREEN: ['CLEARSCREEN', 'CS', 'VIDEECRAN', 'VE'],
    HOME: ['HOME', 'MAISON'],
    REPEAT: ['REPEAT', 'REPETE'],
    SETPENCOLOR: ['SETPENCOLOR', 'SETPC', 'FIXECOULEURCRAYON', 'FCC'],
    SETHEADING: ['SETHEADING', 'SETH', 'FIXECAP', 'FC'],
    SETPOS: ['SETPOS', 'FIXEPOSITION', 'FPOS'],
    SETX: ['SETX', 'FIXEX'],
    SETY: ['SETY', 'FIXEY'],
    SETBACKGROUND: ['SETBACKGROUND', 'SETBG', 'FIXECOULEURFOND', 'FCF'],
    // Add more commands and aliases here
};

// Reverse map for quick lookup during tokenization
export const allCommands = new Set<string>();
export const commandReverseMap = new Map<string, string>(); // Maps alias -> canonical EN name

for (const canonical in commandAliases) {
    commandAliases[canonical].forEach(alias => {
        const upperAlias = alias.toUpperCase();
        allCommands.add(upperAlias);
        commandReverseMap.set(upperAlias, canonical.toUpperCase());
    });
}