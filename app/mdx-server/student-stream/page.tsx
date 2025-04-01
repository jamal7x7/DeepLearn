'use client';

import React, { useState, useEffect, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import MdxRenderer from '../components/MdxRenderer';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';

// Define the shape of the data received from the socket
interface CurrentMdxData {
    fileName: string;
    content: string;
}

export default function StudentStreamPage() {
    const [serializedSource, setSerializedSource] = useState<MDXRemoteSerializeResult | null>(null);
    const [currentFileName, setCurrentFileName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);

    // Function to compile MDX content via API
    const compileMdx = useCallback(async (mdxContent: string, fileName: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/mdx/compile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mdxContent }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setSerializedSource(data.serializedSource);
            setCurrentFileName(fileName);
        } catch (err) {
            console.error("Failed to compile MDX:", err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred during compilation.');
            setSerializedSource(null); // Clear previous content on error
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // Initialize Socket.IO connection
        // The fetch call ensures the custom server is handling requests before connecting
        fetch('/api/socketio').finally(() => { // Simple API call to ensure server is ready
            const newSocket = io();
            setSocket(newSocket);

            newSocket.on('connect', () => {
                console.log('Student connected to Socket.IO server');
            });

            // Listen for the current MDX data
            newSocket.on('current-mdx', (data: CurrentMdxData) => {
                console.log('Received current-mdx:', data.fileName);
                if (data.content) {
                    compileMdx(data.content, data.fileName);
                } else {
                    // Handle case where content might be empty or file invalid
                    setSerializedSource(null);
                    setCurrentFileName(data.fileName);
                    setError(`Content for ${data.fileName} is currently unavailable.`);
                    setIsLoading(false);
                }
            });

            newSocket.on('disconnect', () => {
                console.log('Student disconnected from Socket.IO server');
                setError('Disconnected from server. Attempting to reconnect...');
                // Optionally implement reconnection logic or UI feedback
            });

            newSocket.on('connect_error', (err) => {
                console.error('Socket connection error:', err);
                setError(`Connection failed: ${err.message}`);
                setIsLoading(false);
            });

            // Cleanup on component unmount
            return () => {
                newSocket.disconnect();
            };
        });

    }, [compileMdx]); // Add compileMdx dependency

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Student Content Stream</h1>
            {currentFileName && <p className="text-sm text-muted-foreground mb-4">Displaying: {currentFileName}</p>}

            {isLoading && <div>Loading content...</div>}
            {error && <div className="text-red-600 border border-red-600 p-3 rounded bg-red-50">Error: {error}</div>}

            {!isLoading && !error && serializedSource && (
                <MdxRenderer serializedSource={serializedSource} />
            )}
             {!isLoading && !error && !serializedSource && (
                <div>No content is currently being streamed or an error occurred.</div>
            )}
        </div>
    );
}