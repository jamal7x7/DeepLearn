// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const fs = require('fs').promises; // Use promises version of fs
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const contentDir = path.join(__dirname, 'app', 'mdx-server', 'content');
let currentMdxFile = 'example1.mdx'; // Default file
let currentMdxContent = ''; // Cache content

async function readCurrentFileContent() {
  try {
    const filePath = path.join(contentDir, currentMdxFile);
    currentMdxContent = await fs.readFile(filePath, 'utf-8');
    console.log(`Loaded content for ${currentMdxFile}`);
  } catch (error) {
    console.error(`Error reading file ${currentMdxFile}:`, error);
    currentMdxContent = `# Error\n\nCould not load content for ${currentMdxFile}.`;
    // Optionally reset currentMdxFile if it's invalid
    // currentMdxFile = null;
  }
}

app.prepare().then(async () => {
  // Load initial content
  await readCurrentFileContent();

  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer);
  
  // Track total connected clients from student-stream
  let connectedClients = 0;
  // Track connected socket IDs from student-stream
  let connectedSocketIds = new Set();
  // Track which sockets are from student-stream
  let studentStreamSockets = new Set();

  io.on('connection', (socket) => {
    // Check if connection is from student-stream page
    const isStudentStream = socket.handshake.headers.referer && 
      socket.handshake.headers.referer.includes('/mdx-server/student-stream');
    
    if (isStudentStream) {
      connectedClients++;
      connectedSocketIds.add(socket.id);
      studentStreamSockets.add(socket.id);
      console.log('Student connected:', socket.id, 'Total student connections:', connectedClients);
    } else {
      console.log('Non-student client connected:', socket.id);
    }

    // Send the currently selected file and its content to the new client
    socket.emit('current-mdx', { fileName: currentMdxFile, content: currentMdxContent });
    
    // Broadcast updated connection count and socket IDs to all clients
    io.emit('connection-count', { count: connectedClients, socketIds: Array.from(connectedSocketIds) });

    // Handle teacher selecting a new file
    socket.on('select-file', async (fileName) => {
      if (typeof fileName === 'string') {
        console.log(`Teacher selected: ${fileName}`);
        currentMdxFile = fileName;
        await readCurrentFileContent();
        // Broadcast the new file and content to all clients (students)
        io.emit('current-mdx', { fileName: currentMdxFile, content: currentMdxContent });
      } else {
        console.warn('Received invalid fileName type:', typeof fileName);
      }
    });

     // Handle teacher saving content changes
     socket.on('save-content', async ({ fileName, content }) => {
        if (typeof fileName === 'string' && typeof content === 'string') {
            console.log(`Teacher saving: ${fileName}`);
            const filePath = path.join(contentDir, fileName);
            try {
                await fs.writeFile(filePath, content, 'utf-8');
                console.log(`Saved content to ${fileName}`);
                // If the saved file is the currently active one, update cache and broadcast
                if (fileName === currentMdxFile) {
                    currentMdxContent = content;
                    io.emit('current-mdx', { fileName: currentMdxFile, content: currentMdxContent });
                }
                // Optionally, notify the editor UI that save was successful
                socket.emit('save-success', fileName);
            } catch (error) {
                console.error(`Error saving file ${fileName}:`, error);
                // Notify the editor UI about the error
                socket.emit('save-error', { fileName, message: error.message });
            }
        } else {
             console.warn('Received invalid data for save-content:', {fileName, content});
        }
     });

    // Handle requests for the list of MDX files
    socket.on('get-file-list', async (callback) => {
        try {
            const files = await fs.readdir(contentDir);
            const mdxFiles = files.filter(file => file.endsWith('.mdx'));
            if (typeof callback === 'function') {
                callback(mdxFiles);
            }
        } catch (error) {
            console.error('Error reading content directory:', error);
             if (typeof callback === 'function') {
                callback([]); // Send empty list on error
            }
        }
    });

     // Handle requests for specific file content (for editor)
     socket.on('get-file-content', async ({ fileName }, callback) => {
        if (typeof fileName === 'string' && typeof callback === 'function') {
            const filePath = path.join(contentDir, fileName);
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                callback({ success: true, content });
            } catch (error) {
                console.error(`Error reading file ${fileName} for editor:`, error);
                callback({ success: false, message: `Could not read file: ${fileName}` });
            }
        } else {
             console.warn('Invalid request for get-file-content');
             if(typeof callback === 'function') {
                callback({ success: false, message: 'Invalid request parameters.' });
             }
        }
     });


    // Handle requests for connected socket IDs
    socket.on('get-socket-ids', () => {
      socket.emit('connection-count', { count: connectedClients, socketIds: Array.from(connectedSocketIds) });
    });

    socket.on('disconnect', () => {
      // Only decrement counter if this was a student-stream socket
      if (studentStreamSockets.has(socket.id)) {
        connectedClients--;
        connectedSocketIds.delete(socket.id);
        studentStreamSockets.delete(socket.id);
        console.log('Student disconnected:', socket.id, 'Total student connections:', connectedClients);
        // Broadcast updated connection count and socket IDs to all clients
        io.emit('connection-count', { count: connectedClients, socketIds: Array.from(connectedSocketIds) });
      } else if (connectedSocketIds.has(socket.id)) {
        // Handle non-student socket that was somehow in the IDs set
        connectedSocketIds.delete(socket.id);
        console.log('Non-student client disconnected:', socket.id);
      } else {
        console.log('Duplicate disconnect event for:', socket.id);
      }
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});