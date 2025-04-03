// app/page.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createHighlighter, Highlighter } from 'shiki';
import Editor from 'react-simple-code-editor';
// import { Turtle } from '@/lib/turtle'; // No longer needed directly
import { TurtleStyle, TURTLE_STYLES, DEFAULT_TURTLE_STYLE } from '@/lib/turtleStyles';
// import { LogoInterpreter } from '@/lib/interpreter'; // No longer needed directly
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TurtleSelector } from '@/app/components/TurtleSelector';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// import { Play, Square, ZoomIn, ZoomOut, RefreshCw, Palette } from 'lucide-react'; // Removed unused icons
import { Play, Square, Gauge } from 'lucide-react'; // Added Gauge icon for speed control
import { Slider } from "@/components/ui/slider"; // Import Slider component
import { Label } from "@/components/ui/label"; // Import Label component

// Import the new preview component
import { TurtlePreview } from '@/app/components/TurtlePreview';

// Import theme hook
import { useTheme } from 'next-themes';

// Import theme JSONs
import darkTheme from '../../assets/moonlight-ii.json';
// Import the new light theme
import lightTheme from '../../assets/moonlight-ii-light.json'; // Changed from github-light.json

// Canvas size constants might not be needed here anymore, TurtlePreview uses defaults
// const CANVAS_WIDTH = 2000;
// const CANVAS_HEIGHT = 1600;
const LOG_AREA_HEIGHT = '200px';
// Zoom constants removed
// const ZOOM_FACTOR = 1.2;
// const MIN_ZOOM = 0.2;
// const MAX_ZOOM = 5.0;

// Speed slider constants
const MIN_SPEED = 1;
const MAX_SPEED = 100;
const DEFAULT_SPEED = 10;

const defaultCode = `
ve

POUR C :m :n :t
  repete :m[ 
    fcc hasard 255 hasard 255 hasard 255
    REPETE :n [ AV :t TD 360/:n wait 10 ] 
    td 360/:m
    ]
FIN

C 40 20 30
`;

export default function LogoPage() {
    const [code, setCode] = useState<string>(defaultCode);
    const [logs, setLogs] = useState<string[]>(["Interpreter ready."]); // Initial log
    const [isRunning, setIsRunning] = useState<boolean>(false); // Added back for run button control
    const [isHighlighterReady, setIsHighlighterReady] = useState(false);
    const [currentTurtleStyle, setCurrentTurtleStyle] = useState<TurtleStyle>(DEFAULT_TURTLE_STYLE);
    const [animationSpeed, setAnimationSpeed] = useState<number>(DEFAULT_SPEED); // Add state for animation speed
    const highlighterRef = useRef<Highlighter | null>(null);

    // Get theme info
    const { resolvedTheme } = useTheme();

    // useEffect for Shiki highlighter remains the same
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
    }, []); // End of Shiki useEffect

    // Added back run and stop handlers
    const handleRunCode = useCallback(() => {
        setIsRunning(true);
    }, []);

    const handleStopCode = useCallback(() => {
        setIsRunning(false);
    }, []);

    // Style Change Handler - Simplified
    const handleStyleChange = useCallback((newStyle: TurtleStyle) => {
        setCurrentTurtleStyle(newStyle);
        // TurtlePreview component will react to the prop change
    }, []);

    // Speed Change Handler
    const handleSpeedChange = useCallback((value: number[]) => {
        const newSpeed = value[0];
        if (newSpeed !== undefined) {
            // Update the turtle style with the new speed
            setCurrentTurtleStyle(prevStyle => ({
                ...prevStyle,
                speed: newSpeed
            }));
            setAnimationSpeed(newSpeed);
        }
    }, []);

    // Log Handler for TurtlePreview
    const handleInterpreterLog = useCallback((newLogs: string[]) => {
        setLogs(newLogs);
    }, []);

    // Determine theme names from imported JSONs
    const lightThemeName = lightTheme.name || 'moonlight-ii-light';
    const darkThemeName = darkTheme.name || 'moonlight-ii';

    return (
        <TooltipProvider delayDuration={100}>
            <div className="flex flex-row h-screen w-screen p-4 gap-4 bg-background overflow-hidden">

                <div className="w-1/3 h-full flex flex-col">
                    <Card
                        className="relative flex flex-col flex-grow border bg-card" // Keep Card structure
                    >
                        {/* Add Run button */}
                        <div className="absolute bottom-4 right-4 z-10 flex gap-2">
                            {isRunning ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button 
                                            variant="destructive" 
                                            size="sm" 
                                            onClick={handleStopCode}
                                            className="flex items-center gap-2"
                                        >
                                            <Square className="h-4 w-4" />
                                            Stop Execution
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Stop Logo Execution</TooltipContent>
                                </Tooltip>
                            ) : (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button 
                                            variant="default" 
                                            size="sm" 
                                            onClick={handleRunCode}
                                            disabled={isRunning}
                                            className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
                                        >
                                            <Play className="h-4 w-4" />
                                            Run Code
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Execute Logo Code</TooltipContent>
                                </Tooltip>
                            )}
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
                    {/* Card containing the Turtle Preview */}
                    <Card
                        className="relative flex flex-col flex-grow overflow-hidden border py-0"
                    >
                        {/* Top Right Controls Area - Keep TurtleSelector */}
                        <div className="absolute top-2 right-2 z-10 flex items-center gap-3">
                            {/* Speed Slider */}
                            <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-md p-2 shadow-sm border">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-2">
                                            <Gauge className="h-4 w-4 text-muted-foreground" />
                                            <Label htmlFor="speed-slider" className="text-xs text-muted-foreground whitespace-nowrap">
                                                Speed: {animationSpeed}
                                            </Label>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">Adjust Animation Speed</TooltipContent>
                                </Tooltip>
                                <Slider
                                    id="speed-slider"
                                    className="w-24"
                                    min={MIN_SPEED}
                                    max={MAX_SPEED}
                                    step={1}
                                    value={[animationSpeed]}
                                    onValueChange={handleSpeedChange}
                                />
                            </div>
                            <TurtleSelector
                                currentStyle={currentTurtleStyle}
                                onStyleSelect={handleStyleChange}
                            />
                        </div>

                        {/* Replace Canvas with TurtlePreview */}
                        <CardContent className="flex justify-center items-center p-0 flex-grow overflow-hidden">
                           <TurtlePreview
                                code={code}
                                style={currentTurtleStyle}
                                isRunning={isRunning}
                                requestStop={handleStopCode}
                                onLog={handleInterpreterLog}
                                backgroundColor={resolvedTheme === 'dark' ? '#1e1e1e' : '#fafafa'}
                           />
                        </CardContent>
                    </Card>

                    {/* Log Area Card remains the same */}
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
