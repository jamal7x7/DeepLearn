// app/page.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createHighlighter, Highlighter } from 'shiki';
import Editor from 'react-simple-code-editor';
import { Turtle } from '@/lib/turtle';
import { TurtleStyle, TURTLE_STYLES, DEFAULT_TURTLE_STYLE } from '@/lib/turtleStyles'; // Import styles
import { LogoInterpreter } from '@/lib/interpreter';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TurtleSelector } from '@/app/components/TurtleSelector'; // Import selector
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Play, Square, ZoomIn, ZoomOut, RefreshCw, Palette } from 'lucide-react'; // Added Palette for consistency if needed elsewhere

// Import theme hook
import { useTheme } from 'next-themes';

// Import theme JSONs
import darkTheme from '../../assets/moonlight-ii.json';
// Import the new light theme
import lightTheme from '../../assets/moonlight-ii-light.json'; // Changed from github-light.json

const CANVAS_WIDTH = 2000;
const CANVAS_HEIGHT = 1600;
const CANVAS_ASPECT_RATIO = `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`;
const LOG_AREA_HEIGHT = '200px';
const ZOOM_FACTOR = 1.2; // How much to zoom in/out each step
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 5.0;

const defaultCode = `

ve
; fcf will be set based on theme initially
; fcf 20 20 20
fcc 222 222 222
to koch :size :level
  if :level = 0 [ fd :size ]
  if :level != 0 [
    koch :size / 3 :level - 1
    lt 60
    koch :size / 3 :level - 1
    rt 120
    koch :size / 3 :level - 1
    lt 60
    koch :size / 3 :level - 1
  ]
end

pu
setpos -100 -200
pd
repeat 3 [
  koch 400 4
  rt 120
]

; fcf 50 0 0 ; Example override
`;

export default function LogoPage() {
    const [code, setCode] = useState<string>(defaultCode);
    const [logs, setLogs] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [isHighlighterReady, setIsHighlighterReady] = useState(false);
    const [canvasBgColor, setCanvasBgColor] = useState<string>('rgb(255,255,255)');
    const [zoomLevel, setZoomLevel] = useState<number>(1);
    const [currentTurtleStyle, setCurrentTurtleStyle] = useState<TurtleStyle>(DEFAULT_TURTLE_STYLE); // Add state for turtle style
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const turtleInstanceRef = useRef<Turtle | null>(null);
    const interpreterInstanceRef = useRef<LogoInterpreter | null>(null);
    const highlighterRef = useRef<Highlighter | null>(null);

    // Get theme info
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        if (canvasRef.current && !interpreterInstanceRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = CANVAS_WIDTH;
                canvas.height = CANVAS_HEIGHT;

                // Determine initial background based on theme
                const initialBg = resolvedTheme === 'dark' ? 'rgb(30, 30, 30)' : 'rgb(250, 250, 250)';

                const turtle = new Turtle(
                    ctx,
                    CANVAS_WIDTH,
                    CANVAS_HEIGHT,
                    initialBg, // Pass initial background
                    (newColor) => { setCanvasBgColor(newColor); }, // Pass update callback
                    currentTurtleStyle // Pass initial style
                );

                setCanvasBgColor(turtle.getBackgroundColor()); // Set state from turtle's actual initial color

                const interpreter = new LogoInterpreter();
                interpreter.setTurtle(turtle);
                turtleInstanceRef.current = turtle;
                interpreterInstanceRef.current = interpreter;
                turtle.clearScreen(); // Clear with initial color
                turtle.drawTurtle();
                setLogs(["Interpreter ready."]);
            } else {
                setLogs(["Error: Failed to initialize Canvas."]);
            }
        }
    // Re-run if theme or *initial* style changes (though style shouldn't change initially often)
    }, [resolvedTheme, currentTurtleStyle]);

    useEffect(() => {
        let isMounted = true;
        createHighlighter({
            themes: [lightTheme as any, darkTheme as any],
            langs: ['plaintext', 'logo'],
        }).then((highlighter: Highlighter) => {
            if (isMounted) {
                highlighterRef.current = highlighter;
                setIsHighlighterReady(true);
            }
        }).catch((err: unknown) => {
            if (isMounted) {
                console.error("Failed to load Shiki highlighter:", err instanceof Error ? err.message : err);
            }
        });
        return () => { isMounted = false; };
    }, []);

    const handleRunCode = useCallback(async () => {
        const interpreter = interpreterInstanceRef.current;
        if (!interpreter) return;
        setIsRunning(true);
        setLogs(["Running code..."]);
        let finalLogs: string[] = [];
        try {
            finalLogs = await interpreter.execute(code);
        } catch (error) {
            if (error instanceof Error && error.message === "STOP") {
                finalLogs = [...interpreter.getLog()];
            } else {
                console.error("Unexpected error during handleRunCode:", error);
                finalLogs = [...interpreter.getLog(), `UNEXPECTED UI ERROR: ${error instanceof Error ? error.message : String(error)}`];
            }
        } finally {
            setLogs(finalLogs);
            setIsRunning(false);
        }
    }, [code]);

    const handleStopCode = useCallback(() => {
        const interpreter = interpreterInstanceRef.current;
        if (interpreter && isRunning) {
            interpreter.requestStop();
        }
    }, [isRunning]);

    // Style Change Handler
    const handleStyleChange = useCallback((newStyle: TurtleStyle) => {
        setCurrentTurtleStyle(newStyle);
        if (turtleInstanceRef.current) {
            turtleInstanceRef.current.setStyle(newStyle);
            // Force a redraw if the turtle is visible and not currently running code
            // This requires modifying the interpreter or having a dedicated redraw function
            // For now, the style change will apply on the next interpreter step or run
             if (turtleInstanceRef.current.getIsVisible() && !isRunning) { // Use getter here
               // Simple redraw logic: clear and draw turtle in new style
               // Note: This clears any existing drawings if called standalone.
               // A better approach might involve a dedicated redraw function in the interpreter
               // that preserves the drawing state.
               // turtleInstanceRef.current.clearScreen(); // Avoid clearing full screen
               // turtleInstanceRef.current.drawTurtle(); // Draw with new style
               console.log("Style changed, redraw needed (manual trigger or next run)");
             }
        }
    }, [isRunning]);


    // Zoom Handlers
    const handleZoomIn = useCallback(() => {
        setZoomLevel(prev => Math.min(MAX_ZOOM, prev * ZOOM_FACTOR));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoomLevel(prev => Math.max(MIN_ZOOM, prev / ZOOM_FACTOR));
    }, []);

    const handleResetZoom = useCallback(() => {
        setZoomLevel(1);
    }, []);

    // Determine theme names from imported JSONs
    const lightThemeName = lightTheme.name || 'moonlight-ii-light';
    const darkThemeName = darkTheme.name || 'moonlight-ii';

    return (
        <TooltipProvider delayDuration={100}>
            <div className="flex flex-row h-screen w-screen p-4 gap-4 bg-background overflow-hidden">

                <div className="w-1/3 h-full flex flex-col">
                    <Card
                        className="relative flex flex-col flex-grow border bg-card"
                    >
                        <div className="absolute bottom-2 right-2 z-10 flex gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={handleRunCode} size="icon" aria-label="Run Code" disabled={isRunning} className="h-8 w-8">
                                        <Play className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Execute Code</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={handleStopCode} size="icon" variant="destructive" aria-label="Stop Code" disabled={!isRunning} className="h-8 w-8">
                                        <Square className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Stop Execution</p></TooltipContent>
                            </Tooltip>
                        </div>

                        <CardContent className="flex flex-col flex-grow p-0 overflow-hidden">
                            <Editor
                                value={code}
                                onValueChange={newCode => setCode(newCode)}
                                highlight={codeToHighlight => {
                                    if (highlighterRef.current && isHighlighterReady) {
                                        try {
                                            const lang = highlighterRef.current.getLoadedLanguages().includes('logo') ? 'logo' : 'plaintext';
                                            const currentThemeName = resolvedTheme === 'dark' ? darkThemeName : lightThemeName;
                                            const highlightedHtml = highlighterRef.current.codeToHtml(codeToHighlight, {
                                                lang,
                                                theme: currentThemeName
                                            });
                                            const match = highlightedHtml.match(/<pre.*?><code.*?>(.*)<\/code><\/pre>/s);
                                            return match ? match[1] : codeToHighlight.replace(/</g, "<").replace(/>/g, ">");
                                        } catch (error) {
                                            console.error("Error highlighting code in Editor:", error);
                                            return codeToHighlight.replace(/</g, "<").replace(/>/g, ">");
                                        }
                                    }
                                    return codeToHighlight.replace(/</g, "<").replace(/>/g, ">");
                                }}
                                padding={16}
                                textareaId="logo-code"
                                className="relative w-full h-full flex-grow"
                                textareaClassName="focus-visible:!outline-none w-full h-full !bg-transparent"
                                preClassName="p-0 m-0 w-full h-full !bg-transparent"
                                style={{
                                    fontFamily: '"Fira Code", "Fira Mono", monospace',
                                    fontSize: '0.875rem',
                                    lineHeight: 1.5,
                                    overflow: 'auto',
                                }}
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="w-2/3 h-full flex flex-col gap-4">
                    <Card
                        className="relative flex flex-col flex-grow overflow-hidden border"
                        style={{ backgroundColor: canvasBgColor }}
                    >
                        {/* Top Right Controls Area */}
                        <div className="absolute top-2 right-2 z-10">
                             <TurtleSelector
                                currentStyle={currentTurtleStyle}
                                onStyleSelect={handleStyleChange}
                            />
                        </div>

                        {/* Bottom Right Controls Area */}
                        <div className="absolute bottom-2 right-2 z-10 flex gap-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={handleZoomIn} variant="outline" size="icon" className="h-8 w-8 bg-background/50 hover:bg-background/75 backdrop-blur-sm" aria-label="Zoom In">
                                        <ZoomIn className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Zoom In</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={handleZoomOut} variant="outline" size="icon" className="h-8 w-8 bg-background/50 hover:bg-background/75 backdrop-blur-sm" aria-label="Zoom Out">
                                        <ZoomOut className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Zoom Out</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={handleResetZoom} variant="outline" size="icon" className="h-8 w-8 bg-background/50 hover:bg-background/75 backdrop-blur-sm" aria-label="Reset Zoom">
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Reset Zoom (1:1)</p></TooltipContent>
                            </Tooltip>
                        </div>

                        <CardContent className="flex justify-center items-center p-0 flex-grow overflow-hidden">
                            <div className="w-full h-full overflow-hidden flex justify-center items-center">
                                <canvas
                                    ref={canvasRef}
                                    className="bg-transparent transition-transform duration-100 ease-linear"
                                    style={{
                                        transform: `scale(${zoomLevel})`,
                                        transformOrigin: 'center center',
                                    }}
                                    width={CANVAS_WIDTH}
                                    height={CANVAS_HEIGHT}
                                >
                                    Your browser does not support the canvas element.
                                </canvas>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="relative flex flex-col border bg-card" style={{ height: LOG_AREA_HEIGHT }}>
                        <CardContent className="flex-grow flex flex-col p-0">
                            <ScrollArea className="w-full h-full rounded-md bg-muted/40 flex-grow">
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
