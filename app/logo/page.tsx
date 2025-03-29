// app/page.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Turtle } from '@/lib/turtle';
import { LogoInterpreter } from '@/lib/interpreter';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Play, Maximize2, Minimize2 } from 'lucide-react';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const CANVAS_ASPECT_RATIO = `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`;

const defaultCode = `; Side-by-Side Layout Test
VE FCC 255 100 0 PD
REPEAT 5 [
    FD 120 RT 144
]
PU HOME BK 150 FCC 0 150 150 PD
REPEAT 36 [ FD 150 BK 150 RT 10 ]
`;

type EnlargedSection = 'code' | 'canvas' | 'logs' | null;

export default function LogoPage() {
    const [code, setCode] = useState<string>(defaultCode);
    const [logs, setLogs] = useState<string[]>([]);
    const [enlargedSection, setEnlargedSection] = useState<EnlargedSection>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const turtleInstanceRef = useRef<Turtle | null>(null);
    const interpreterInstanceRef = useRef<LogoInterpreter | null>(null);

    // Initialization useEffect remains the same
    useEffect(() => {
        if (canvasRef.current && !interpreterInstanceRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = CANVAS_WIDTH;
                canvas.height = CANVAS_HEIGHT;
                const turtle = new Turtle(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);
                const interpreter = new LogoInterpreter();
                interpreter.setTurtle(turtle);
                turtleInstanceRef.current = turtle;
                interpreterInstanceRef.current = interpreter;
                turtle.clearScreen();
                turtle.drawTurtle();
                setLogs(["Interpreter ready."]);
            } else {
                setLogs(["Error: Failed to initialize Canvas."]);
            }
        }
    }, []);

    // handleRunCode remains the same
    const handleRunCode = useCallback(() => {
        const interpreter = interpreterInstanceRef.current;
        if (!interpreter) return;
        interpreter.execute(code);
        setLogs([...interpreter.getLog()]);
    }, [code]);

    // toggleEnlarge remains the same
    const toggleEnlarge = (section: 'code' | 'canvas' | 'logs') => {
        setEnlargedSection(prev => (prev === section ? null : section));
    };

    return (
        <TooltipProvider delayDuration={100}>
            {/* Main container: flex column, takes full height */}
            <div className={`container mx-auto p-4 md:p-6 lg:p-8 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${enlargedSection !== null ? 'max-w-full px-2' : ''}`}>

                {/* Header: Hidden when any section is enlarged */}
                <header className={`mb-6 text-center ${enlargedSection !== null ? 'hidden' : ''}`}>
                    <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">Logo Interpreter</h1>
                    <p className="text-muted-foreground mt-2">Next.js 15, Shadcn/UI, Tailwind CSS</p>
                     <p className="text-sm text-muted-foreground mt-1">Supports: FD/AV, BK/RE, RT/TD, LT/TG, PU/LC, PD/BC, CS/VE, HOME/MAISON, REPEAT/REPETE, SETPC/FCC, SETH/FC, SETX/Y, SETPOS/FPOS, SETBG/FCF</p>
                </header>

                {/* Content Area: Takes remaining vertical space */}
                 <div className="flex flex-col flex-grow gap-6 lg:gap-8">

                    {/* Top Row: Code & Canvas (Grid layout) */}
                    {/* Hidden if Logs are enlarged */}
                    <div className={`grid grid-cols-1 ${enlargedSection === 'logs' ? 'hidden' : ''} ${enlargedSection === null ? 'md:grid-cols-2' : 'grid-cols-1'} gap-6 lg:gap-8 ${enlargedSection !== null ? 'flex-grow' : ''}`}>
                        {/* Code Input Card */}
                        {/* Show if null or 'code' enlarged */}
                        <Card className={`relative flex flex-col ${enlargedSection === 'canvas' || enlargedSection === 'logs' ? 'hidden' : ''} ${enlargedSection === 'code' ? 'flex-grow' : ''}`}>
                            <CardHeader className="flex flex-row items-start justify-between pb-2">
                                <div>
                                    <CardTitle>Logo Code</CardTitle>
                                    <CardDescription className={`${enlargedSection === 'code' ? 'hidden' : ''}`}>Enter commands</CardDescription>
                                </div>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => toggleEnlarge('code')} aria-label={enlargedSection === 'code' ? "Minimize Code" : "Enlarge Code"} className="h-8 w-8">
                                            {enlargedSection === 'code' ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{enlargedSection === 'code' ? "Minimize" : "Enlarge"}</p></TooltipContent>
                                </Tooltip>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-4 flex-grow">
                                <div className="grid w-full gap-1.5 flex-grow">
                                    <Label htmlFor="logo-code" className={`${enlargedSection === 'code' ? 'hidden' : ''}`}>Commands</Label>
                                    <Textarea
                                        id="logo-code"
                                        placeholder="e.g., REPETE 4 [ AV 100 TD 90 ]"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        className={`font-mono text-sm resize-y flex-grow ${enlargedSection === 'code' ? 'min-h-[75vh]' : 'min-h-[300px]'}`} // Adjust height
                                        spellCheck="false"
                                    />
                                </div>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button onClick={handleRunCode} size="lg" className="w-full lg:w-auto mt-auto" aria-label="Run Code">
                                            <Play className="h-5 w-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Execute Code</p></TooltipContent>
                                </Tooltip>
                            </CardContent>
                        </Card>

                        {/* Canvas Card */}
                        {/* Show if null or 'canvas' enlarged */}
                        <Card className={`relative flex flex-col ${enlargedSection === 'code' || enlargedSection === 'logs' ? 'hidden' : ''} ${enlargedSection === 'canvas' ? 'flex-grow' : ''}`}>
                             <CardHeader className="flex flex-row items-center justify-between pb-2">
                                 <div>
                                    <CardTitle>Turtle Canvas</CardTitle>
                                    <CardDescription className={`${enlargedSection === 'canvas' ? 'hidden' : ''}`}>Visual output</CardDescription>
                                </div>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => toggleEnlarge('canvas')} aria-label={enlargedSection === 'canvas' ? "Minimize Canvas" : "Enlarge Canvas"} className="h-8 w-8">
                                            {enlargedSection === 'canvas' ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{enlargedSection === 'canvas' ? "Minimize" : "Enlarge"}</p></TooltipContent>
                                </Tooltip>
                            </CardHeader>
                            <CardContent className={`flex justify-center items-center p-2 md:p-4 flex-grow`}>
                                <canvas
                                    ref={canvasRef}
                                    className={`border border-muted bg-card transition-all duration-300 ease-in-out ${
                                        enlargedSection === 'canvas'
                                        ? 'w-[90vw] h-auto max-w-[calc(90vh*(${CANVAS_ASPECT_RATIO}))] max-h-[85vh]'
                                        : 'max-w-full h-auto w-full' // Ensure takes width in normal grid
                                    }`}
                                     style={{ aspectRatio: CANVAS_ASPECT_RATIO }}
                                >
                                    Your browser does not support the canvas element.
                                </canvas>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Bottom Row: Logs Card */}
                    {/* Hidden if Code or Canvas are enlarged */}
                    <Card className={`relative flex flex-col ${enlargedSection === 'code' || enlargedSection === 'canvas' ? 'hidden' : ''} ${enlargedSection === 'logs' ? 'flex-grow' : ''}`}>
                        <CardHeader className="flex flex-row items-start justify-between pb-2">
                            <div>
                                <CardTitle>Execution Log</CardTitle>
                                <CardDescription className={`${enlargedSection === 'logs' ? 'hidden' : ''}`}>Interpreter output</CardDescription>
                            </div>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => toggleEnlarge('logs')} aria-label={enlargedSection === 'logs' ? "Minimize Logs" : "Enlarge Logs"} className="h-8 w-8">
                                        {enlargedSection === 'logs' ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{enlargedSection === 'logs' ? "Minimize" : "Enlarge"}</p></TooltipContent>
                            </Tooltip>
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col">
                            <ScrollArea className={`w-full rounded-md border bg-muted/40 flex-grow ${enlargedSection === 'logs' ? 'min-h-[75vh]' : 'h-[200px]'}`}>
                                <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-words p-3">
                                    {logs.length > 0 ? logs.join('\n') : 'No commands executed yet.'}
                                </pre>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TooltipProvider>
    );
}