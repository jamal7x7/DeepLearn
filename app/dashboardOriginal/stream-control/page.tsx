'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import io, { Socket } from 'socket.io-client';
import { toast } from "sonner";
import { PlusCircle, FileText, Play, Eye, Save, Users, Wifi, WifiOff, Loader2, RadioTower } from "lucide-react"; // Added RadioTower icon
import dynamic from 'next/dynamic';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";


// import { IconUsers, IconId } from "@tabler/icons-react"; // Using lucide-react now
import { Badge } from "@/components/ui/badge";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Will use simple buttons/divs for selection
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from "@/components/ui/separator"; // Added
// Dynamically import the MdxPreview component to avoid SSR issues
const MdxPreview = dynamic(() => import('@/app/mdx-server/components/MdxPreview'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-center">Chargement de la prévisualisation...</p>
        </div>
    </div>
});

export default function TeacherControlPage() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [fileList, setFileList] = useState<string[]>([]);
    const [selectedFileForStream, setSelectedFileForStream] = useState<string>('');
    const [selectedFileForEdit, setSelectedFileForEdit] = useState<string>('');
    const [editorContent, setEditorContent] = useState<string>('');
    const [savedContent, setSavedContent] = useState<string>(''); // Track last saved content
    const [isLoadingFileList, setIsLoadingFileList] = useState(true);
    const [isLoadingContent, setIsLoadingContent] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [serverStatus, setServerStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
    const [newFileName, setNewFileName] = useState<string>('');
    const [connectionCount, setConnectionCount] = useState<number>(0);
    const [connectedSockets, setConnectedSockets] = useState<Array<{id: string, ip: string}>>([]);
    const [connectedSocketIds, setConnectedSocketIds] = useState<string[]>([]);
    // const [showPreview, setShowPreview] = useState<boolean>(false); // Replaced with isPreviewVisible
    const [isPreviewVisible, setIsPreviewVisible] = useState<boolean>(false); // State for inline preview visibility

    // Ref to track if initial load is done to prevent premature actions
    const isInitialLoadDone = useRef(false);

    // Categorize files using useMemo
    const categorizedFiles = useMemo(() => {
        const levels: { [key: string]: string[] } = {
            level1: [],
            level2: [],
            level3: [],
            others: [],
        };
        fileList.forEach(file => {
            if (file.toLowerCase().startsWith('l1')) {
                levels.level1.push(file);
            } else if (file.toLowerCase().startsWith('l2')) {
                levels.level2.push(file);
            } else if (file.toLowerCase().startsWith('l3')) {
                levels.level3.push(file);
            } else {
                levels.others.push(file);
            }
        });
        // Sort files within each category alphabetically
        Object.keys(levels).forEach(key => levels[key].sort());
        return levels;
    }, [fileList]);

    // Helper function to render file selection items
    const renderFileSelectItem = (file: string) => (
        <Button
            key={`select-${file}`}
            variant="ghost"
            size="sm"
            className={cn(
                "w-full justify-start gap-2 px-2",
                selectedFileForStream === file && "bg-primary/10 text-primary font-semibold", // Highlight streamed file
                selectedFileForEdit === file && selectedFileForStream !== file && "bg-accent" // Highlight selected for edit if different
            )}
            onClick={() => handleFileSelect(file)} // Use a unified select handler
        >
            <FileText className="h-4 w-4 flex-shrink-0" />
            <div className="flex items-center justify-between w-full">
                {selectedFileForStream === file && (
                    <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <RadioTower
                                    className="h-4 w-4 text-primary animate-pulse  bg-background rounded-full p-0.5 shadow"
                                />
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>Currently Streaming</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
                <span className="truncate flex-1 text-left">{file}</span>
            </div>
        </Button>
    );

    // Initialize Socket.IO connection
    useEffect(() => {
        fetch('/api/socketio').finally(() => { // Ping to ensure server is ready
            const newSocket = io();
            setSocket(newSocket);
            setServerStatus('connecting');

            newSocket.on('connect', () => {
                console.log('Teacher connected to Socket.IO server');
                setServerStatus('connected');
                // Request file list and current stream state once connected
                newSocket.emit('get-file-list', (files: string[]) => {
                    setFileList(files || []);
                    setIsLoadingFileList(false);
                });
                // Also get the initially streamed file from the server
                newSocket.on('current-mdx', ({ fileName }: { fileName: string }) => {
                    if (!isInitialLoadDone.current) {
                        setSelectedFileForStream(fileName || '');
                        isInitialLoadDone.current = true; // Mark initial load as done
                    } else {
                        // Update stream status if changed by another source
                        setSelectedFileForStream(fileName || '');
                    }
                });
            });

            newSocket.on('disconnect', () => {
                console.log('Teacher disconnected');
                setServerStatus('disconnected');
                toast.error("Disconnected from server.");
            });

            newSocket.on('connect_error', (err) => {
                console.error('Teacher connection error:', err);
                setServerStatus('error');
                toast.error(`Connection failed: ${err.message}`);
            });

            // Listen for connection count updates
            newSocket.on('connection-count', ({ count, socketData }: { count: number, socketData?: Array<{id: string, ip: string}> }) => {
                setConnectionCount(count);
                if (socketData) {
                    setConnectedSockets(socketData);
                }
            });
            
            // Request connected socket IDs
            newSocket.emit('get-socket-ids');

            // Listen for save success/error feedback
            newSocket.on('save-success', (fileName: string) => {
                setIsSaving(false);
                toast.success(`Successfully saved ${fileName}`);
            });
            newSocket.on('save-error', ({ fileName, message }: { fileName: string, message: string }) => {
                setIsSaving(false);
                setSavedContent(editorContent); // Update saved content on save success
                toast.error(`Error saving ${fileName}: ${message}`);
            });

            return () => {
                newSocket.disconnect();
            };
        });
    }, []); // Empty dependency array ensures this runs only once

    // Handler for selecting a file for editing/preview ONLY
    const handleFileSelect = (fileName: string) => {
        if (!socket) return;
        // Select for Editing/Preview
        handleEditFileSelect(fileName); // Load content into editor
        // Do NOT automatically stream here anymore
        setIsPreviewVisible(false); // Hide preview when selecting a new file
    };

    // Handler for explicitly streaming the file selected for editing
    const handleExplicitStream = () => {
        const fileName = selectedFileForEdit; // Stream the file currently in the editor
        if (socket && fileName && fileName !== selectedFileForStream && serverStatus === 'connected') {
            setSelectedFileForStream(fileName);
            socket.emit('select-file', fileName);
            toast.success(`Started streaming: ${fileName}`);
        } else if (fileName === selectedFileForStream) {
             toast.info(`${fileName} is already streaming.`);
        } else if (!fileName) {
            toast.warning("No file selected to stream.");
        } else if (serverStatus !== 'connected') {
            toast.error("Cannot stream: Server disconnected.");
        }
    };

    // Handle selecting a file to edit
    const handleEditFileSelect = useCallback((fileName: string, currentSocket: Socket | null = socket) => {
        if (currentSocket && fileName) {
            setSelectedFileForEdit(fileName);
            setIsLoadingContent(true);
            setEditorContent(''); // Clear previous content
            currentSocket.emit('get-file-content', { fileName }, (response: { success: boolean; content?: string; message?: string }) => {
                setIsLoadingContent(false);
                if (response.success && response.content !== undefined) {
                    setEditorContent(response.content);
                    setSavedContent(response.content); // Update saved content on load
                } else {
                    toast.error(`Error loading ${fileName}: ${response.message || 'Unknown error'}`);
                    setEditorContent(`// Failed to load content for ${fileName}`);
                }
            });
        }
    }, [socket]); // Depends on socket

    // Handle editor content change
    const handleEditorChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditorContent(event.target.value);
    };

    // Handle saving the edited content
    const handleSaveContent = () => {
        if (socket && selectedFileForEdit && !isSaving) {
            setIsSaving(true);
            toast.info(`Saving ${selectedFileForEdit}...`);
            socket.emit('save-content', { fileName: selectedFileForEdit, content: editorContent });
            // Feedback (success/error) is handled by socket listeners 'save-success'/'save-error'
        }
    };

    // Handle creating a new MDX file
    const handleCreateNewFile = () => {
        if (socket && newFileName && !isSaving) {
            // Validate filename
            const fileName = newFileName.endsWith('.mdx') ? newFileName : `${newFileName}.mdx`;
            setIsSaving(true);
            toast.info(`Creating new file: ${fileName}...`);
            
            // Default content for new MDX file
            const defaultContent = `---
title: ${fileName.replace('.mdx', '')}
description: New MDX document
---

# ${fileName.replace('.mdx', '')}

Write your content here...
`;
            
            socket.emit('save-content', { fileName, content: defaultContent, isNew: true });
            
            // Reset the new file name input
            setNewFileName('');
            
            // Update file list after creating new file
            socket.emit('get-file-list', (files: string[]) => {
                setFileList(files || []);
                // Select the new file for editing
                handleEditFileSelect(fileName, socket);
            });
        } else if (!newFileName) {
            toast.error("Please enter a file name");
        }
    };

    return (
        <div className="container mx-auto p-4 lg:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold">Stream Control</h1>
                    <p className="text-muted-foreground">Manage MDX content streaming and editing.</p>
                </div>
                 <div className="flex items-center gap-4">
                     <Badge variant={serverStatus === 'connected' ? 'default' : 'destructive'} className="gap-2">
                         {serverStatus === 'connected' ? <Wifi className="h-4 w-4"/> : serverStatus === 'connecting' ? <Loader2 className="h-4 w-4 animate-spin"/> : <WifiOff className="h-4 w-4"/>}
                         Server: {serverStatus}
                     </Badge>
                     <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge variant="secondary" className="gap-2 cursor-default">
                                    <Users className="h-4 w-4"/> {connectionCount} Connected
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                {connectedSockets.length > 0 ? (
                                    <ul className="text-xs">
                                        {connectedSockets.map(s => <li key={s.id}>ID: {s.id.substring(0, 5)}... (IP: {s.ip})</li>)}
                                    </ul>
                                ) : (
                                    <p>No students connected.</p>
                                )}
                            </TooltipContent>
                        </Tooltip>
                     </TooltipProvider>
                 </div>
            </div>

            <Separator />

            {/* Main Content Area - Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: File Selection & Streaming */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Select File to Stream/Edit</CardTitle>
                        <CardDescription>Click a file to stream it and load it for editing.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingFileList ? (
                            <div className="text-center py-4 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin inline mr-2"/> Loading files...
                            </div>
                        ) : fileList.length > 0 ? (
                            <Tabs defaultValue="level1" className="w-full">
                                <TabsList className="grid w-full grid-cols-4 mb-4 h-auto">
                                    <TabsTrigger value="level1" disabled={categorizedFiles.level1.length === 0} className="text-xs px-1">Lvl 1 ({categorizedFiles.level1.length})</TabsTrigger>
                                    <TabsTrigger value="level2" disabled={categorizedFiles.level2.length === 0} className="text-xs px-1">Lvl 2 ({categorizedFiles.level2.length})</TabsTrigger>
                                    <TabsTrigger value="level3" disabled={categorizedFiles.level3.length === 0} className="text-xs px-1">Lvl 3 ({categorizedFiles.level3.length})</TabsTrigger>
                                    <TabsTrigger value="others" disabled={categorizedFiles.others.length === 0} className="text-xs px-1">Other ({categorizedFiles.others.length})</TabsTrigger>
                                </TabsList>
                                <ScrollArea className="h-[400px] pr-3"> {/* Added ScrollArea */}
                                    <div className="space-y-1">
                                        <TabsContent value="level1" className="mt-0 space-y-1">
                                            {categorizedFiles.level1.length > 0
                                                ? categorizedFiles.level1.map(renderFileSelectItem)
                                                : <p className="text-sm text-muted-foreground text-center py-2">No Level 1 files.</p>}
                                        </TabsContent>
                                        <TabsContent value="level2" className="mt-0 space-y-1">
                                            {categorizedFiles.level2.length > 0
                                                ? categorizedFiles.level2.map(renderFileSelectItem)
                                                : <p className="text-sm text-muted-foreground text-center py-2">No Level 2 files.</p>}
                                        </TabsContent>
                                        <TabsContent value="level3" className="mt-0 space-y-1">
                                            {categorizedFiles.level3.length > 0
                                                ? categorizedFiles.level3.map(renderFileSelectItem)
                                                : <p className="text-sm text-muted-foreground text-center py-2">No Level 3 files.</p>}
                                        </TabsContent>
                                        <TabsContent value="others" className="mt-0 space-y-1">
                                            {categorizedFiles.others.length > 0
                                                ? categorizedFiles.others.map(renderFileSelectItem)
                                                : <p className="text-sm text-muted-foreground text-center py-2">No other files.</p>}
                                        </TabsContent>
                                    </div>
                                </ScrollArea>
                            </Tabs>
                        ) : (
                            <div className="text-center py-4 border rounded-md">
                                <p className="text-muted-foreground">No MDX files found.</p>
                                <p className="text-xs text-muted-foreground mt-1">Create one using the panel on the right.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right Column: Editor, Preview, Create */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                <div>
                                    <CardTitle>Edit & Preview</CardTitle>
                                    <CardDescription>
                                        {selectedFileForEdit ? (
                                            <TooltipProvider delayDuration={100}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="max-w-[150px] truncate inline-block align-middle">
                                                            Editing: {selectedFileForEdit}
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="bottom">
                                                        {selectedFileForEdit}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ) : "Select a file or create a new one"}
                                    </CardDescription>
                                </div>
                                {selectedFileForEdit && selectedFileForEdit === selectedFileForStream && (
                                    <TooltipProvider delayDuration={100}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <RadioTower
                                                    className="h-5 w-5 text-primary animate-pulse"
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom">
                                                <p>Currently Streaming</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                             </div>
                             <div className="flex flex-wrap gap-2"> {/* Added flex-wrap */}
                                 <Button
                                     size="sm"
                                     variant={isPreviewVisible ? "secondary" : "outline"} // Change variant when active
                                     onClick={() => setIsPreviewVisible(!isPreviewVisible)} // Toggle inline preview
                                     disabled={!selectedFileForEdit || serverStatus !== 'connected'}
                                     title={isPreviewVisible ? "Hide Preview" : "Show Preview"} // Added title
                                 >
                                     <Eye className="mr-2 h-4 w-4" /> {isPreviewVisible ? "Hide" : "Show"} Preview
                                 </Button>
                                  <Button
                                     size="sm"
                                     variant="outline"
                                     onClick={handleExplicitStream}
                                     disabled={!selectedFileForEdit || selectedFileForEdit === selectedFileForStream || serverStatus !== 'connected'}
                                     title={selectedFileForEdit === selectedFileForStream ? `${selectedFileForEdit} is already streaming` : `Stream ${selectedFileForEdit || 'selected file'}`} // Added title
                                 >
                                     <RadioTower className="mr-2 h-4 w-4 " /> Stream File
                                 </Button>
                                 <Button
                                    size="sm"
                                    onClick={handleSaveContent}
                                    disabled={
                                        !selectedFileForEdit ||
                                        isSaving ||
                                        serverStatus !== 'connected' ||
                                        editorContent === savedContent // Disable if no changes
                                    }
                                    title="Save"
                                 >
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                 </Button>
                             </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         {/* Main Content Area: Toggle between Editor and Preview */}
                         <div className="min-h-[400px] border rounded-md"> {/* Added wrapper div */}
                             {isLoadingContent ? (
                                 <div className="flex justify-center items-center h-full text-muted-foreground">
                                     <Loader2 className="h-6 w-6 animate-spin inline mr-2"/> Loading content...
                                 </div>
                             ) : !selectedFileForEdit ? (
                                 <div className="flex justify-center items-center h-full text-muted-foreground">
                                     <p>Select a file from the left to edit or preview.</p>
                                 </div>
                             ) : isPreviewVisible ? (
                                 // Preview Mode
                                 <div className="p-4 overflow-y-auto h-[400px] bg-background"> {/* Adjust height as needed */}
                                      <MdxPreview
                                         fileName={selectedFileForEdit}
                                         socket={socket}
                                     />
                                 </div>
                             ) : (
                                 // Editor Mode
                                 <Textarea
                                     value={editorContent}
                                     onChange={handleEditorChange}
                                     placeholder="MDX content..."
                                     className="h-full w-full border-0 resize-none font-mono text-sm focus-visible:ring-0" // Adjusted styles
                                     disabled={serverStatus !== 'connected'}
                                 />
                             )}
                         </div>
                         {/* Inline Preview Area Removed - now toggled with editor */}

                         <Separator />

                         <div>
                             <Label htmlFor="new-file-name" className="text-sm font-medium">Create New File</Label>
                             <div className="flex gap-2 mt-1">
                                 <Input
                                     id="new-file-name"
                                     type="text"
                                     placeholder="new-document.mdx"
                                     value={newFileName}
                                     onChange={(e) => setNewFileName(e.target.value)}
                                     className="flex-1"
                                     disabled={isSaving || serverStatus !== 'connected'}
                                 />
                                 <Button
                                     onClick={handleCreateNewFile}
                                     disabled={!newFileName || isSaving || serverStatus !== 'connected'}
                                 >
                                     <PlusCircle className="mr-2 h-4 w-4" /> Create
                                 </Button>
                             </div>
                         </div>
                    </CardContent>
                </Card>
            </div>
      
        
            {/* MDX Preview Modal Removed - Now inline */}
        </div>
    );
}