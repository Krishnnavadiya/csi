const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for command-line input/output
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Promisify rl.question
function question(query) {
    return new Promise(resolve => {
        rl.question(query, resolve);
    });
}

// Define the directory where files will be stored
const filesDirectory = path.join(__dirname, 'files');

// Create the files directory if it doesn't exist
if (!fsSync.existsSync(filesDirectory)) {
    fsSync.mkdirSync(filesDirectory);
    console.log(`Created directory: ${filesDirectory}`);
}

// Display menu options
async function displayMenu() {
    console.log('\n===== File Management Tool =====');
    console.log('1. List all files');
    console.log('2. Create a new file');
    console.log('3. Read a file');
    console.log('4. Delete a file');
    console.log('5. Exit');
    
    const choice = await question('\nEnter your choice (1-5): ');
    await handleMenuChoice(choice);
}

// Handle menu choice
async function handleMenuChoice(choice) {
    try {
        switch (choice) {
            case '1':
                await listFiles();
                break;
            case '2':
                await createFile();
                break;
            case '3':
                await readFile();
                break;
            case '4':
                await deleteFile();
                break;
            case '5':
                console.log('Exiting program. Goodbye!');
                rl.close();
                return;
            default:
                console.log('Invalid choice. Please try again.');
                await displayMenu();
                return;
        }
    } catch (error) {
        console.error('An error occurred:', error.message);
        await displayMenu();
    }
}

// Function to list all files
async function listFiles() {
    try {
        const files = await fs.readdir(filesDirectory);
        console.log('\n===== Files =====');
        if (files.length === 0) {
            console.log('No files found.');
        } else {
            files.forEach((file, index) => {
                console.log(`${index + 1}. ${file}`);
            });
        }
    } catch (error) {
        console.error('Error reading directory:', error);
        console.log('Failed to list files.');
    }
    
    await displayMenu();
}

// Function to create a file
async function createFile() {
    try {
        const filename = await question('Enter filename: ');
        
        if (!filename) {
            console.log('Filename is required.');
            await displayMenu();
            return;
        }

        // Sanitize filename to prevent directory traversal attacks
        const sanitizedFilename = path.basename(filename);
        const filePath = path.join(filesDirectory, sanitizedFilename);

        const content = await question('Enter file content (press Enter for empty file): ');
        
        await fs.writeFile(filePath, content || '');
        console.log(`File '${sanitizedFilename}' created successfully.`);
    } catch (error) {
        console.error('Error creating file:', error);
        console.log('Failed to create file.');
    }
    
    await displayMenu();
}

// Function to read a file
async function readFile() {
    try {
        const filename = await question('Enter filename to read: ');
        
        if (!filename) {
            console.log('Filename is required.');
            await displayMenu();
            return;
        }

        // Sanitize filename to prevent directory traversal attacks
        const sanitizedFilename = path.basename(filename);
        const filePath = path.join(filesDirectory, sanitizedFilename);

        const data = await fs.readFile(filePath, 'utf8');
        console.log(`\n===== Content of '${sanitizedFilename}' =====`);
        console.log(data || '(Empty file)');
        console.log('===== End of file =====');
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`File '${path.basename(error.path)}' not found.`);
        } else {
            console.error('Error reading file:', error);
            console.log('Failed to read file.');
        }
    }
    
    await displayMenu();
}

// Function to delete a file
async function deleteFile() {
    try {
        const filename = await question('Enter filename to delete: ');
        
        if (!filename) {
            console.log('Filename is required.');
            await displayMenu();
            return;
        }

        // Sanitize filename to prevent directory traversal attacks
        const sanitizedFilename = path.basename(filename);
        const filePath = path.join(filesDirectory, sanitizedFilename);

        // Confirm deletion
        const answer = await question(`Are you sure you want to delete '${sanitizedFilename}'? (y/n): `);
        
        if (answer.toLowerCase() !== 'y') {
            console.log('Deletion cancelled.');
            await displayMenu();
            return;
        }

        await fs.unlink(filePath);
        console.log(`File '${sanitizedFilename}' deleted successfully.`);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`File '${path.basename(error.path)}' not found.`);
        } else {
            console.error('Error deleting file:', error);
            console.log('Failed to delete file.');
        }
    }
    
    await displayMenu();
}

// Start the application
(async function() {
    console.log('Welcome to the File Management Tool!');
    console.log(`Files will be stored in: ${filesDirectory}`);
    await displayMenu();
})();