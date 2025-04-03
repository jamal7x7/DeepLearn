// lib/types.ts

export enum TokenType {
    COMMAND = 'COMMAND',
    NUMBER = 'NUMBER',
    LBRACKET = 'LBRACKET', // [
    RBRACKET = 'RBRACKET', // ]
    TO = 'TO',             // TO keyword for procedure definition
    END = 'END',           // END keyword for procedure definition
    WORD = 'WORD',         // For procedure names, variable names etc.
    COLON = 'COLON',       // : for parameters/variables
    LPAREN = 'LPAREN',     // (
    RPAREN = 'RPAREN',     // )
    OPERATOR = 'OPERATOR', // +, -, *, /
    COMPARISON_OPERATOR = 'COMPARISON_OPERATOR', // <, >, =
    EOF = 'EOF', // End of File/Input
    ERROR = 'ERROR', // For tokenization errors
}

export interface Token {
    type: TokenType;
    value: string;
    line: number; // Line number for error reporting
    column: number; // Column number for error reporting
}

// --- Abstract Syntax Tree (AST) Nodes ---

// Base interface for all AST nodes
export interface ASTNode {
    type: string;
    line: number; // For error reporting during interpretation
    column: number; // For error reporting during interpretation
}

// Represents a command invocation, e.g., FD 100
export interface CommandNode extends ASTNode {
    type: 'Command';
    command: string; // Canonical command name (e.g., FORWARD)
    args: Expression[]; // Arguments must be expressions
}

// Represents a numeric literal
export interface NumberNode extends ASTNode {
    type: 'Number';
    value: number;
}

// Represents a REPEAT block
export interface RepeatNode extends ASTNode {
    type: 'Repeat';
    count: ASTNode; // How many times to repeat
    body: Statement[]; // List of statements inside the REPEAT block
}

// Represents a procedure definition
export interface ProcedureDefinitionNode extends ASTNode {
    type: 'ProcedureDefinition';
    name: string;
    parameters: string[]; // Names of parameters (without the colon)
    body: Statement[]; // List of statements inside the procedure
}

// Represents a procedure call
export interface ProcedureCallNode extends ASTNode {
    type: 'ProcedureCall';
    name: string;
    arguments: Expression[]; // Arguments must be expressions
}

// Represents a variable reference (used for parameters initially)
export interface VariableNode extends ASTNode {
    type: 'Variable';
    name: string; // Name of the variable/parameter (without the colon)
}

// Represents a RANDOM function call (treated as an expression)
export interface RandomNode extends ASTNode {
    type: 'Random';
    max: ASTNode; // The upper bound (exclusive) expression
}

// Represents a binary operation, e.g., :x + 5
export interface BinaryOpNode extends ASTNode {
    type: 'BinaryOp';
    operator: string; // '+', '-', '*', '/'
    left: Expression;
    right: Expression;
}

// Represents a comparison operation, e.g., :x > 5
export interface ComparisonNode extends ASTNode {
    type: 'Comparison';
    operator: string; // '<', '>', '='
    left: Expression;
    right: Expression;
}

// Represents an IF statement
export interface IfNode extends ASTNode {
    type: 'If';
    condition: Expression; // Condition must evaluate to boolean-like (0 or 1 in simple Logo)
    body: Statement[]; // Statements to execute if true
    // Optional: Add elseBody later if needed
}

// Represents an OUTPUT statement (for returning values from procedures)
export interface OutputNode extends ASTNode {
    type: 'Output';
    value: Expression; // The value to return
}


// An expression node can be one of these (Added ComparisonNode and ProcedureCallNode)
export type Expression = NumberNode | VariableNode | RandomNode | BinaryOpNode | ComparisonNode | ProcedureCallNode;

// A statement can be any of the following node types that represent an action (Added IfNode, OutputNode)
export type Statement = CommandNode | RepeatNode | ProcedureDefinitionNode | ProcedureCallNode | IfNode | OutputNode;

// The program is a list of statements
export type Program = Statement[];


// --- Interpreter State ---
// (You might want to define types for the interpreter's state, like the symbol table)

export interface Procedure {
    name: string;
    parameters: string[];
    body: Statement[];
    line?: number; // Optional: Line where the procedure was defined
    column?: number; // Optional: Column where the procedure was defined
}

export interface SymbolTable {
    [name: string]: Procedure | number; // Can store procedures or variable values
}

// --- End AST Nodes ---


// --- Keyword Aliases ---

// Map canonical keywords to their aliases
export const keywordAliases: { [key: string]: string[] } = {
    TO: ['TO', 'POUR'],
    END: ['END', 'FIN'],
    // Add other keywords like IF/SI, THEN/ALORS etc. here later
};

// Reverse map for quick lookup during tokenization
export const allKeywords = new Set<string>();
export const keywordReverseMap = new Map<string, string>(); // Maps alias -> canonical keyword type (e.g., "POUR" -> "TO")

for (const canonical in keywordAliases) {
    keywordAliases[canonical].forEach(alias => {
        const upperAlias = alias.toUpperCase();
        allKeywords.add(upperAlias);
        // Store the canonical TokenType name (as a string) associated with the alias
        keywordReverseMap.set(upperAlias, canonical.toUpperCase()); // e.g., keywordReverseMap.set("POUR", "TO")
    });
}


// --- Turtle Animation Actions ---

export interface TurtleState {
    x: number;
    y: number;
    angle: number; // Degrees, 0 is typically 'up' or 'right' depending on convention
    penDown: boolean;
    penColor: string; // e.g., 'rgb(r,g,b)' or '#rrggbb'
    isVisible: boolean;
}

export interface MoveAction {
    type: 'move';
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    distance: number; // The requested distance (positive for FD, negative for BK)
    penDown: boolean; // Pen status *during* this move
    penColor: string; // Pen color *during* this move
}

export interface TurnAction {
    type: 'turn';
    startAngle: number;
    endAngle: number;
    degrees: number; // Amount turned (positive for RT, negative for LT)
}

export interface PenAction {
    type: 'pen';
    penDown: boolean; // The new state
}

export interface ColorAction {
    type: 'color';
    color: string; // The new pen color
}

export interface ClearAction {
    type: 'clear';
}

export interface HomeAction {
    type: 'home';
    // Includes implicit move to 0,0 and set angle to 0
    // We might generate separate move/turn actions instead,
    // but a dedicated action can be simpler for the animator.
}

export interface WaitAction {
    type: 'wait';
    duration: number; // Milliseconds or ticks
}

export interface VisibilityAction {
    type: 'visibility';
    isVisible: boolean; // The new state
}

// Union type for all possible actions the interpreter generates
export type TurtleAction =
    | MoveAction
    | TurnAction
    | PenAction
    | ColorAction
    | ClearAction
    | HomeAction
    | WaitAction
    | VisibilityAction;


// --- Command Aliases ---

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
    RANDOM: ['RANDOM', 'HASARD'],
    WAIT: ['WAIT', 'ATTEND'],
    IF: ['IF', 'SI'],
    OUTPUT: ['OUTPUT', 'RENVOIE'],
    PRINT: ['PRINT', 'ECRIS'],
    HIDETURTLE: ['HIDETURTLE', 'HT', 'CACHETORTUE', 'CT'],
    SHOWTURTLE: ['SHOWTURTLE', 'ST', 'MONTRETORTUE', 'MT'],
    // Add more commands and aliases here
};

// Reverse map for quick lookup during tokenization
export const allCommands = new Set<string>();
export const commandReverseMap = new Map<string, string>(); // Maps alias -> canonical EN command name

for (const canonical in commandAliases) {
    commandAliases[canonical].forEach(alias => {
        const upperAlias = alias.toUpperCase();
        allCommands.add(upperAlias);
        commandReverseMap.set(upperAlias, canonical.toUpperCase());
    });
}
