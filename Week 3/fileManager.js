const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');

// Define the directory where files will be stored
const filesDirectory = path.join(__dirname, 'files');

// Create the files directory if it doesn't exist
if (!fsSync.existsSync(filesDirectory)) {
    fsSync.mkdirSync(filesDirectory);
    console.log(`Created directory: ${filesDirectory}`);
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
    try {
        // Parse the URL and query parameters
        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;
        const query = parsedUrl.query;

        // Set CORS headers to allow requests from any origin
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            res.statusCode = 204; // No content
            return res.end();
        }

        // Handle root path - serve the HTML interface
        if (pathname === '/') {
            res.setHeader('Content-Type', 'text/html');
            res.end(getHtmlInterface());
            return;
        }

        // API endpoints
        if (pathname === '/api/files') {
            // List all files
            if (req.method === 'GET') {
                await listFiles(res);
                return;
            }

            // Create a new file
            if (req.method === 'POST') {
                const body = await getRequestBody(req);
                try {
                    const { filename, content } = JSON.parse(body);
                    await createFile(filename, content, res);
                } catch (error) {
                    sendJsonResponse(res, 400, { error: 'Invalid request format' });
                }
                return;
            }
        }

        // Read a specific file
        if (pathname === '/api/files/read' && req.method === 'GET') {
            const filename = query.filename;
            if (!filename) {
                sendJsonResponse(res, 400, { error: 'Filename is required' });
                return;
            }
            await readFile(filename, res);
            return;
        }

        // Delete a specific file
        if (pathname === '/api/files/delete' && req.method === 'DELETE') {
            const filename = query.filename;
            if (!filename) {
                sendJsonResponse(res, 400, { error: 'Filename is required' });
                return;
            }
            await deleteFile(filename, res);
            return;
        }

        // Not found
        sendJsonResponse(res, 404, { error: 'Not found' });
    } catch (error) {
        console.error('Server error:', error);
        sendJsonResponse(res, 500, { error: 'Internal server error' });
    }
});

// Helper function to get request body
function getRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            resolve(body);
        });
        req.on('error', (err) => {
            reject(err);
        });
    });
}

// Function to list all files
async function listFiles(res) {
    try {
        const files = await fs.readdir(filesDirectory);
        sendJsonResponse(res, 200, { files });
    } catch (err) {
        console.error('Error reading directory:', err);
        sendJsonResponse(res, 500, { error: 'Failed to list files' });
    }
}

// Function to create a file
async function createFile(filename, content, res) {
    if (!filename) {
        sendJsonResponse(res, 400, { error: 'Filename is required' });
        return;
    }

    // Sanitize filename to prevent directory traversal attacks
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(filesDirectory, sanitizedFilename);

    try {
        await fs.writeFile(filePath, content || '');
        sendJsonResponse(res, 201, { message: `File '${sanitizedFilename}' created successfully` });
    } catch (err) {
        console.error('Error creating file:', err);
        sendJsonResponse(res, 500, { error: 'Failed to create file' });
    }
}

// Function to read a file (server-side)
async function readFile(filename, res) {
    // Sanitize filename to prevent directory traversal attacks
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(filesDirectory, sanitizedFilename);

    try {
        const content = await fs.readFile(filePath, 'utf8');
        sendJsonResponse(res, 200, { filename: sanitizedFilename, content });
    } catch (err) {
        if (err.code === 'ENOENT') {
            sendJsonResponse(res, 404, { error: `File '${sanitizedFilename}' not found` });
        } else {
            console.error('Error reading file:', err);
            sendJsonResponse(res, 500, { error: 'Failed to read file' });
        }
    }
}

// Function to delete a file
async function deleteFile(filename, res) {
    // Sanitize filename to prevent directory traversal attacks
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(filesDirectory, sanitizedFilename);

    try {
        await fs.unlink(filePath);
        sendJsonResponse(res, 200, { message: `File '${sanitizedFilename}' deleted successfully` });
    } catch (err) {
        if (err.code === 'ENOENT') {
            sendJsonResponse(res, 404, { error: `File '${sanitizedFilename}' not found` });
        } else {
            console.error('Error deleting file:', err);
            sendJsonResponse(res, 500, { error: 'Failed to delete file' });
        }
    }
}

// Helper function to send JSON responses
function sendJsonResponse(res, statusCode, data) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = statusCode;
    res.end(JSON.stringify(data));
}

// Function to generate the HTML interface
function getHtmlInterface() {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>File Management Tool</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                line-height: 1.6;
            }
            h1 {
                color: #333;
                text-align: center;
            }
            .section {
                margin-bottom: 30px;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 5px;
            }
            label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
            }
            input, textarea {
                width: 100%;
                padding: 8px;
                margin-bottom: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-sizing: border-box;
            }
            button {
                background-color: #4CAF50;
                color: white;
                padding: 10px 15px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
            }
            button:hover {
                background-color: #45a049;
            }
            #fileList {
                list-style-type: none;
                padding: 0;
            }
            .file-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                margin-bottom: 5px;
                background-color: #f9f9f9;
                border-radius: 4px;
            }
            .file-actions {
                display: flex;
                gap: 10px;
            }
            .read-btn {
                background-color: #2196F3;
            }
            .read-btn:hover {
                background-color: #0b7dda;
            }
            .delete-btn {
                background-color: #f44336;
            }
            .delete-btn:hover {
                background-color: #d32f2f;
            }
            #fileContent {
                white-space: pre-wrap;
                background-color: #f5f5f5;
                padding: 15px;
                border-radius: 4px;
                border: 1px solid #ddd;
                min-height: 100px;
                max-height: 300px;
                overflow-y: auto;
            }
            .hidden {
                display: none;
            }
            .message {
                padding: 10px;
                margin: 10px 0;
                border-radius: 4px;
            }
            .success {
                background-color: #dff0d8;
                color: #3c763d;
                border: 1px solid #d6e9c6;
            }
            .error {
                background-color: #f2dede;
                color: #a94442;
                border: 1px solid #ebccd1;
            }
        </style>
    </head>
    <body>
        <h1>File Management Tool</h1>
        
        <div class="section">
            <h2>Create a New File</h2>
            <div id="createMessage" class="message hidden"></div>
            <form id="createFileForm">
                <label for="filename">Filename:</label>
                <input type="text" id="filename" name="filename" required placeholder="Enter filename (e.g., example.txt)">
                
                <label for="content">Content:</label>
                <textarea id="content" name="content" rows="6" placeholder="Enter file content here"></textarea>
                
                <button type="submit">Create File</button>
            </form>
        </div>
        
        <div class="section">
            <h2>File List</h2>
            <button id="refreshBtn">Refresh List</button>
            <div id="listMessage" class="message hidden"></div>
            <ul id="fileList"></ul>
        </div>
        
        <div id="fileContentSection" class="section hidden">
            <h2>File Content</h2>
            <h3 id="currentFileName"></h3>
            <div id="fileContent"></div>
        </div>
        
        <script>
            // DOM elements
            const createFileForm = document.getElementById('createFileForm');
            const createMessage = document.getElementById('createMessage');
            const fileList = document.getElementById('fileList');
            const refreshBtn = document.getElementById('refreshBtn');
            const listMessage = document.getElementById('listMessage');
            const fileContentSection = document.getElementById('fileContentSection');
            const currentFileName = document.getElementById('currentFileName');
            const fileContent = document.getElementById('fileContent');
            
            // Function to show a message
            function showMessage(element, message, isError = false) {
                element.textContent = message;
                element.classList.remove('hidden', 'success', 'error');
                element.classList.add(isError ? 'error' : 'success');
                
                // Hide message after 5 seconds
                setTimeout(() => {
                    element.classList.add('hidden');
                }, 5000);
            }
            
            // Function to load the file list
            async function loadFileList() {
                try {
                    const response = await fetch('/api/files');
                    const data = await response.json();
                    
                    fileList.innerHTML = '';
                    
                    if (data.files && data.files.length > 0) {
                        data.files.forEach(file => {
                            const li = document.createElement('li');
                            li.className = 'file-item';
                            
                            const fileName = document.createElement('span');
                            fileName.textContent = file;
                            
                            const actions = document.createElement('div');
                            actions.className = 'file-actions';
                            
                            const readBtn = document.createElement('button');
                            readBtn.textContent = 'Read';
                            readBtn.className = 'read-btn';
                            readBtn.onclick = () => readFile(file);
                            
                            const deleteBtn = document.createElement('button');
                            deleteBtn.textContent = 'Delete';
                            deleteBtn.className = 'delete-btn';
                            deleteBtn.onclick = () => deleteFile(file);
                            
                            actions.appendChild(readBtn);
                            actions.appendChild(deleteBtn);
                            
                            li.appendChild(fileName);
                            li.appendChild(actions);
                            fileList.appendChild(li);
                        });
                    } else {
                        const li = document.createElement('li');
                        li.textContent = 'No files found';
                        fileList.appendChild(li);
                    }
                } catch (error) {
                    console.error('Error loading file list:', error);
                    showMessage(listMessage, 'Failed to load file list', true);
                }
            }
            
            // Function to read a file (client-side)
            async function readFile(filename) {
                if (!filename) {
                    console.error('Error: No filename provided to readFile function');
                    showMessage(listMessage, 'Failed to read file: No filename provided', true);
                    return;
                }
                
                try {
                    const response = await fetch(\`/api/files/read?filename=${encodeURIComponent(filename)}\`);
                    if (!response.ok) {
                        throw new Error(\`HTTP error! Status: ${response.status}\`);
                    }
                    
                    const data = await response.json();
                    currentFileName.textContent = data.filename;
                    fileContent.textContent = data.content;
                    fileContentSection.classList.remove('hidden');
                } catch (error) {
                    console.error('Error reading file:', error);
                    showMessage(listMessage, \`Failed to read file: ${filename}\`, true);
                }
            }
            
            // Function to delete a file (client-side)
            async function deleteFile(filename) {
                if (confirm(\`Are you sure you want to delete ${filename}?\`)) {
                    try {
                        const response = await fetch(\`/api/files/delete?filename=${encodeURIComponent(filename)}\`, {
                            method: 'DELETE'
                        });
                        
                        if (!response.ok) {
                            throw new Error(\`HTTP error! Status: ${response.status}\`);
                        }
                        
                        const data = await response.json();
                        showMessage(listMessage, data.message);
                        await loadFileList();
                        
                        // Hide file content section if the deleted file is currently displayed
                        if (currentFileName.textContent === filename) {
                            fileContentSection.classList.add('hidden');
                        }
                    } catch (error) {
                        console.error('Error deleting file:', error);
                        showMessage(listMessage, \`Failed to delete file: ${filename}\`, true);
                    }
                }
            }
            
            // Event listener for create file form submission
            createFileForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const filenameInput = document.getElementById('filename');
                const contentInput = document.getElementById('content');
                
                const data = {
                    filename: filenameInput.value,
                    content: contentInput.value
                };
                
                try {
                    const response = await fetch('/api/files', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });
                    
                    if (!response.ok) {
                        throw new Error(\`HTTP error! Status: ${response.status}\`);
                    }
                    
                    const responseData = await response.json();
                    showMessage(createMessage, responseData.message);
                    filenameInput.value = '';
                    contentInput.value = '';
                    await loadFileList();
                } catch (error) {
                    console.error('Error creating file:', error);
                    showMessage(createMessage, 'Failed to create file', true);
                }
            });
            
            // Event listener for refresh button
            refreshBtn.addEventListener('click', loadFileList);
            
            // Load file list on page load
            document.addEventListener('DOMContentLoaded', loadFileList);
        </script>
    </body>
    </html>
    `;
}

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Files will be stored in: ${filesDirectory}`);
});