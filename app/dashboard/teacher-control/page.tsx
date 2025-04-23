'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import io, { Socket } from 'socket.io-client';
import { toast } from "sonner";
import { PlusCircle, FileText, Send } from "lucide-react"; // Added Send icon
import { IconUsers, IconId } from "@tabler/icons-react";
import dynamic from 'next/dynamic';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox"; // Added Checkbox
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { sendAnnouncementAction } from '@/app/actions/announcement'; // Corrected import path
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';



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
    const [isLoadingFileList, setIsLoadingFileList] = useState(true);
    const [isLoadingContent, setIsLoadingContent] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [serverStatus, setServerStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
    const [newFileName, setNewFileName] = useState<string>('');
    const [connectionCount, setConnectionCount] = useState<number>(0);
    const [connectedSockets, setConnectedSockets] = useState<Array<{id: string, ip: string}>>([]);
    const [connectedSocketIds, setConnectedSocketIds] = useState<string[]>([]);
    const [showPreview, setShowPreview] = useState<boolean>(false);

    // Teams state
    const [teams, setTeams] = useState<Array<{ id: number; name: string }>>([]);
    const [selectedTeam, setSelectedTeam] = useState<{ id: number; name: string } | null>(null); // Used for team context, keep as is for now

    // Announcement state
    const [announcementContent, setAnnouncementContent] = useState<string>('');
    const [selectedTeamIdsForAnnouncement, setSelectedTeamIdsForAnnouncement] = useState<number[]>([]);
    const [isSendingAnnouncement, setIsSendingAnnouncement] = useState<boolean>(false);

    // Fetch teams for the teacher
    useEffect(() => {
        fetch('/api/manage-users/teams')
            .then(res => res.json())
            .then(data => {
                if (data.teams && data.teams.length > 0) {
                    setTeams(data.teams);
                    setSelectedTeam(data.teams[0]);
                }
            });
    }, []);

    // Ref to track if initial load is done to prevent premature actions
    const isInitialLoadDone = useRef(false);

    // --- Team Selector UI ---
    // Place this at the top of your return JSX
    const TeamSelector = (
        <div className="w-full flex items-center gap-4 mb-6">
            <Select
                value={selectedTeam?.id ? String(selectedTeam.id) : ""}
                onValueChange={val => {
                    const team = teams.find(t => String(t.id) === val);
                    setSelectedTeam(team || null);
                }}
                disabled={teams.length === 0}
            >
                <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                    {teams.map(team => (
                        <SelectItem key={team.id} value={String(team.id)}>
                            {team.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <span className="text-muted-foreground text-sm">
                {selectedTeam ? `Team: ${selectedTeam.name}` : "No team selected"}
            </span>
        </div>
    );

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

    // Helper function to render radio items (to avoid repetition)
    const renderRadioItem = (file: string) => (
        <div key={`stream-${file}`} className={cn(
            "flex items-center space-x-2 rounded-md border p-6 cursor-pointer transition-all",
            selectedFileForStream === file ? "border-primary bg-primary/5" : "hover:bg-accent"
        )}>
            <RadioGroupItem value={file} id={`radio-${file}`} />
            <Label
                htmlFor={`radio-${file}`}
                className="flex-1 cursor-pointer flex items-center gap-2 "
            >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium ">{file}</span>
            </Label>
        </div>
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

    // Handle selecting/deselecting teams for announcement
    const handleTeamCheckboxChange = (teamId: number, checked: boolean) => {
        setSelectedTeamIdsForAnnouncement(prev =>
            checked ? [...prev, teamId] : prev.filter(id => id !== teamId)
        );
    };

    // Handle sending the announcement
    const handleSendAnnouncement = async () => {
        if (!announcementContent.trim()) {
            toast.error("Please enter announcement content.");
            return;
        }
        if (selectedTeamIdsForAnnouncement.length === 0) {
            toast.error("Please select at least one team.");
            return;
        }

        setIsSendingAnnouncement(true);
        toast.info("Sending announcement...");

        const result = await sendAnnouncementAction(
            announcementContent,
            selectedTeamIdsForAnnouncement,
            "plain"
        );

        setIsSendingAnnouncement(false);

        if (result.success) {
            toast.success(result.message);
            setAnnouncementContent(''); // Clear content
            setSelectedTeamIdsForAnnouncement([]); // Clear selection
        } else {
            toast.error(result.message || "Failed to send announcement.");
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold ">Teacher Control</h1>
            <p className="text-muted-foreground">Manage MDX content and streaming for students</p>
            {TeamSelector}

            {/* Connected Users and Socket IDs cards - above tabs */}
            <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 mb-6">
                <Card className="@container/card">
                    <CardHeader>
                        <CardDescription>Connected Users</CardDescription>
                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                            {connectionCount}
                        </CardTitle>
                        <CardAction>
                            <Badge variant="outline">
                                <IconUsers className="size-4" />
                                Live
                            </Badge>
                        </CardAction>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                        <div className="line-clamp-1 flex gap-2 font-medium">
                            Total socket connections
                        </div>
                        <div className="text-muted-foreground">
                            Students currently connected to the stream
                        </div>
                    </CardFooter>
                </Card>
                
                <Card className="@container/card">
                    <CardHeader>
                        <div className="flex items-center gap-2">
  <CardDescription>Active Connections</CardDescription>
  <div className="flex space-x-1">
    {connectedSockets.map((socket) => (
      <Tooltip key={socket.id}>
        <TooltipTrigger className="cursor-default">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs font-mono">{socket.id}</p>
        </TooltipContent>
      </Tooltip>
    ))}
  </div>
</div>
                        {/* <CardTitle className="text-2xl font-semibold @[250px]/card:text-3xl">
                            Socket IDs
                        </CardTitle> */}
                        <CardAction>
                            <Badge variant="outline">
                                <IconId className="size-4" />
                                IDs
                            </Badge>
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[80px] rounded-md border p-2">
                            {connectedSockets.length > 0 ? (
                                <ul className="space-y-2">
                                    {connectedSockets.map((socket) => (
                                        <li key={socket.id} className="text-sm flex items-center gap-2">
                                            <Badge variant="secondary" className="font-mono">
                                                {socket.id}
                                            </Badge>
                                            <Badge variant="outline" className="font-mono ml-2">
                                                {socket.ip}
                                            </Badge>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">No connected sockets</p>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="stream" className="w-full flex-col justify-start gap-6">
                <div className="flex items-center justify-between mx-4 lg:mx-6">
                    <TabsList className="bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]">
                        <TabsTrigger value="stream" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Stream Control</TabsTrigger>
                        <TabsTrigger value="editor" className="data-[state=active]:bg-background data-[state=active]:text-foreground">MDX Editor</TabsTrigger>
                        <TabsTrigger value="announcements" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Announcements</TabsTrigger>
                    </TabsList>
                    
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={!selectedFileForStream || serverStatus !== 'connected'}
                        onClick={() => setShowPreview(true)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        Prévisualiser
                    </Button>
                </div>
                
                <TabsContent value="stream" className="relative flex flex-col gap-4 overflow-auto px-0 lg:px-0">
                    <Card className="@container/card">
                        <CardHeader>
                            <CardTitle>Stream Control</CardTitle>
                            <CardDescription>Select the MDX file to be streamed live to students.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="stream-select" className="text-base font-medium">Streaming File:</Label>
                                    <span className={`text-sm px-2 py-1 rounded-full ${serverStatus === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        Server: {serverStatus}
                                    </span>
                                </div>
                                
                                {isLoadingFileList ? (
                                    <div className="text-center py-4">
                                        <p>Loading files...</p>
                                    </div>
                                ) : fileList.length > 0 ? (
                                   <RadioGroup
                                       value={selectedFileForStream}
                                       onValueChange={handleStreamFileSelect}
                                       className="space-y-4" // Changed class for better spacing with nested tabs
                                       disabled={serverStatus !== 'connected'}
                                   >
                                       <Tabs defaultValue="level1" className="w-full">
                                           <TabsList className="grid w-full grid-cols-4 mb-4">
                                               <TabsTrigger value="level1" disabled={categorizedFiles.level1.length === 0}>Level 1 ({categorizedFiles.level1.length})</TabsTrigger>
                                               <TabsTrigger value="level2" disabled={categorizedFiles.level2.length === 0}>Level 2 ({categorizedFiles.level2.length})</TabsTrigger>
                                               <TabsTrigger value="level3" disabled={categorizedFiles.level3.length === 0}>Level 3 ({categorizedFiles.level3.length})</TabsTrigger>
                                               <TabsTrigger value="others" disabled={categorizedFiles.others.length === 0}>Others ({categorizedFiles.others.length})</TabsTrigger>
                                           </TabsList>

                                           <TabsContent value="level1" className="space-y-3">
                                               {categorizedFiles.level1.length > 0
                                                   ? categorizedFiles.level1.map(renderRadioItem)
                                                   : <p className="text-sm text-muted-foreground text-center py-2">No Level 1 files found.</p>}
                                           </TabsContent>
                                           <TabsContent value="level2" className="space-y-3">
                                               {categorizedFiles.level2.length > 0
                                                   ? categorizedFiles.level2.map(renderRadioItem)
                                                   : <p className="text-sm text-muted-foreground text-center py-2">No Level 2 files found.</p>}
                                           </TabsContent>
                                           <TabsContent value="level3" className="space-y-3">
                                               {categorizedFiles.level3.length > 0
                                                   ? categorizedFiles.level3.map(renderRadioItem)
                                                   : <p className="text-sm text-muted-foreground text-center py-2">No Level 3 files found.</p>}
                                           </TabsContent>
                                           <TabsContent value="others" className="space-y-3">
                                               {categorizedFiles.others.length > 0
                                                   ? categorizedFiles.others.map(renderRadioItem)
                                                   : <p className="text-sm text-muted-foreground text-center py-2">No other files found.</p>}
                                           </TabsContent>
                                       </Tabs>
                                   </RadioGroup>
                               ) : (
                                   <div className="text-center py-4 border rounded-md">
                                       <p className="text-muted-foreground">No MDX files found</p>
                                   </div>
                               )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="editor" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
                    <Card className="@container/card">
                        <CardHeader>
                            <CardTitle>MDX Editor</CardTitle>
                            <CardDescription>Edit existing MDX files or create new ones.</CardDescription>
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
                            
                            <div className="flex items-end space-x-4">
                                <div className="flex-1">
                                    <Label htmlFor="new-file" className="mb-2 block">Create New File:</Label>
                                    <Input 
                                        id="new-file" 
                                        placeholder="Enter file name (e.g., my-document.mdx)" 
                                        value={newFileName}
                                        onChange={(e) => setNewFileName(e.target.value)}
                                        disabled={serverStatus !== 'connected'}
                                    />
                                </div>
                                <Button 
                                    onClick={handleCreateNewFile} 
                                    disabled={!newFileName || serverStatus !== 'connected'}
                                    className="flex items-center gap-2"
                                >
                                    <PlusCircle className="h-4 w-4" />
                                    Create
                                </Button>
                            </div>
                            
                            <div>
                                <Label htmlFor="mdx-editor">Content:</Label>
                                <Textarea
                                    id="mdx-editor"
                                    className="font-mono h-[400px] mt-2"
                                    placeholder={isLoadingContent ? "Loading content..." : "Select a file to edit or create a new one."}
                                    value={editorContent}
                                    onChange={handleEditorChange}
                                    disabled={isLoadingContent || !selectedFileForEdit || serverStatus !== 'connected'}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button
                                onClick={handleSaveContent}
                                disabled={!selectedFileForEdit || isSaving || serverStatus !== 'connected'}
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Announcements Tab */}
                <TabsContent value="announcements" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
                    {/* Announcement History */}

                    
                    {/* Send Announcement */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Send Announcement</CardTitle>
                            <CardDescription>Send a content to selected teams.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Team Selection */}
                            <div>
                                <Label className="text-base font-medium mb-3 block">Select Teams</Label>
                                {teams.length > 0 ? (
                                    <ScrollArea className="h-40 w-full rounded-md border p-4">
                                        <div className="space-y-3">
                                            {teams.map((team) => (
                                                <div key={`announce-team-${team.id}`} className="flex items-center space-x-3">
                                                    <Checkbox
                                                        id={`checkbox-team-${team.id}`}
                                                        checked={selectedTeamIdsForAnnouncement.includes(team.id)}
                                                        onCheckedChange={(checked) => handleTeamCheckboxChange(team.id, !!checked)}
                                                        disabled={isSendingAnnouncement}
                                                    />
                                                    <Label
                                                        htmlFor={`checkbox-team-${team.id}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                    >
                                                        {team.name}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No teams found. Create teams on the 'Teams' page.</p>
                                )}
                            </div>

                            {/* Content Input */}
                            <div>
                                <Label htmlFor="announcement-content" className="text-base font-medium mb-2 block">Content</Label>
                                <Textarea
                                    id="announcement-content"
                                    placeholder="Type your announcement content here..."
                                    value={announcementContent}
                                    onChange={(e) => setAnnouncementContent(e.target.value)}
                                    rows={5}
                                    disabled={isSendingAnnouncement}
                                    className="min-h-[100px]"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button
                                onClick={handleSendAnnouncement}
                                disabled={isSendingAnnouncement || selectedTeamIdsForAnnouncement.length === 0 || !announcementContent.trim()}
                            >
                                {isSendingAnnouncement ? "Sending..." : <><Send className="mr-2 h-4 w-4" /> Send Announcement</>}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        
            {/* MDX Preview Modal */}
            {showPreview && selectedFileForStream && (
                <MdxPreview 
                    fileName={selectedFileForStream} 
                    onClose={() => setShowPreview(false)} 
                    socket={socket}
                />
            )}
        </div>
    );
}