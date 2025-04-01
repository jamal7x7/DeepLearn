'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from "sonner"; // Using sonner for notifications

export default function TeacherControlPage() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [fileList, setFileList] = useState<string[]>([]);
    const [selectedFileForStream, setSelectedFileForStream] = useState<string>('');
    const [selectedFileForEdit, setSelectedFileForEdit] = useState<string>('');
    const [editorContent, setEditorContent] = useState<string>('');
    const [isLoadingFileList, setIsLoadingFileList] = useState(true);
    const [isLoadingContent, setIsLoadingContent] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [serverStatus, setServerStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');

    // Ref to track if initial load is done to prevent premature actions
    const isInitialLoadDone = useRef(false);

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
                        // Optionally load this file into the editor by default
                        // if (fileName) handleEditFileSelect(fileName, newSocket);
                        isInitialLoadDone.current = true; // Mark initial load as done
                    } else {
                         // Update stream status if changed by another source (less likely here)
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

             // Listen for save success/error feedback
             newSocket.on('save-success', (fileName: string) => {
                setIsSaving(false);
                toast.success(`Successfully saved ${fileName}`);
             });
             newSocket.on('save-error', ({ fileName, message }: { fileName: string, message: string }) => {
                setIsSaving(false);
                toast.error(`Error saving ${fileName}: ${message}`);
             });


            return () => {
                newSocket.disconnect();
            };
        });
    }, []); // Empty dependency array ensures this runs only once

    // Handle selecting a file to stream
    const handleStreamFileSelect = (fileName: string) => {
        if (socket && fileName && fileName !== selectedFileForStream) {
            setSelectedFileForStream(fileName);
            socket.emit('select-file', fileName);
            toast.info(`Streaming set to: ${fileName}`);
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

    return (
        <div className="container mx-auto p-4 space-y-6">
            <h1 className="text-3xl font-bold">MDX Teacher Control</h1>
            <p className="text-muted-foreground">Manage and edit MDX content for student streaming.</p>

             <Card>
                <CardHeader>
                    <CardTitle>Stream Control</CardTitle>
                    <CardDescription>Select the MDX file to be streamed live to students.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="flex items-center space-x-4">
                         <Label htmlFor="stream-select" className="w-24">Streaming File:</Label>
                         <Select
                            value={selectedFileForStream}
                            onValueChange={handleStreamFileSelect}
                            disabled={isLoadingFileList || serverStatus !== 'connected'}
                         >
                            <SelectTrigger id="stream-select" className="w-[300px]">
                                <SelectValue placeholder="Select file to stream..." />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoadingFileList ? (
                                    <SelectItem value="loading" disabled>Loading files...</SelectItem>
                                ) : fileList.length > 0 ? (
                                    fileList.map((file) => (
                                        <SelectItem key={`stream-${file}`} value={file}>
                                            {file}
                                        </SelectItem>
                                    ))
                                ) : (
                                     <SelectItem value="no-files" disabled>No MDX files found</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        <span className={`text-sm ${serverStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                            Server: {serverStatus}
                        </span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>MDX Editor</CardTitle>
                    <CardDescription>Select a file to edit its content.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center space-x-4">
                         <Label htmlFor="edit-select" className="w-24">Edit File:</Label>
                         <Select
                            value={selectedFileForEdit}
                            onValueChange={(value) => handleEditFileSelect(value)}
                            disabled={isLoadingFileList || serverStatus !== 'connected'}
                         >
                            <SelectTrigger id="edit-select" className="w-[300px]">
                                <SelectValue placeholder="Select file to edit..." />
                            </SelectTrigger>
                            <SelectContent>
                                 {isLoadingFileList ? (
                                    <SelectItem value="loading" disabled>Loading files...</SelectItem>
                                ) : fileList.length > 0 ? (
                                    fileList.map((file) => (
                                        <SelectItem key={`edit-${file}`} value={file}>
                                            {file}
                                        </SelectItem>
                                    ))
                                 ) : (
                                     <SelectItem value="no-files" disabled>No MDX files found</SelectItem>
                                 )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="mdx-editor">Content:</Label>
                        <Textarea
                            id="mdx-editor"
                            value={editorContent}
                            onChange={handleEditorChange}
                            placeholder="Select a file to load its content here..."
                            rows={20}
                            className="font-mono text-sm" // Basic styling for code
                            disabled={!selectedFileForEdit || isLoadingContent || isSaving || serverStatus !== 'connected'}
                        />
                         {isLoadingContent && <p className="text-sm text-muted-foreground mt-2">Loading content...</p>}
                    </div>
                </CardContent>
                 <CardFooter>
                     <Button
                        onClick={handleSaveContent}
                        disabled={!selectedFileForEdit || isLoadingContent || isSaving || serverStatus !== 'connected'}
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                 </CardFooter>
            </Card>
        </div>
    );
}