import { app, BrowserWindow, shell, ipcMain, protocol, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import {generateAnimation} from '../server/index'

// Get the __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },  
  });

  // Load the index.html from the Vite dev server in development or the index.html from the dist folder in production
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Open links in the default browser instead of the Electron window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
};

// Create window when Electron has finished initialization
app.whenReady().then(() => {

  createWindow();
  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


// Set up IPC handlers (Inter-Process Communication)
ipcMain.handle('generate-animation', async (event, prompt) => {
  try {
    console.log('Received animation generation request:', prompt);
    
    // Progress callback to send updates to renderer
    const onProgress = (message: string) => {
      event.sender.send('generation-progress', message);
    };
    
    const result = await generateAnimation(prompt, onProgress);
    
    // Get the absolute path to the video file
    const absolutePath = path.resolve(result.videoPath);
    console.log('Generated video at absolute path:', absolutePath);
    
    return { 
      success: true, 
      message: 'Animation generated successfully',
      videoPath: absolutePath,
      code: result.code
    };
  } catch (error: any) {
    console.error('Error generating animation:', error);
    return { success: false, message: error.message };
  }
});

// Add handler for saving videos
ipcMain.handle('save-video', async (_event, options) => {
  try {
    // Destructure the incoming options
    const { buffer, defaultName = 'video.mp4' } = options;
    
    if (!buffer) {
      throw new Error('No video data provided');
    }
    
    // Show save file dialog
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Save Video',
      defaultPath: defaultName,
      filters: [
        { name: 'MP4 Videos', extensions: ['mp4'] }
      ],
      properties: ['createDirectory', 'showOverwriteConfirmation']
    });
    
    // User canceled the dialog
    if (canceled || !filePath) {
      return { success: false, message: 'Save operation canceled' };
    }
    
    // Write the file to disk
    const fs = await import('fs/promises');
    await fs.writeFile(filePath, Buffer.from(buffer));
    
    return { success: true, path: filePath };
  } catch (error: any) {
    console.error('Error saving video:', error);
    return { success: false, error: error.message };
  }
});

// Add handler for getting recent videos
ipcMain.handle('get-recent-videos', async () => {
  try {
    // This would typically scan the output directory for recent videos
    // For now, return empty array
    return { success: true, videos: [] };
  } catch (error: any) {
    return { success: false, error: error.message, videos: [] };
  }
});

// Add handler for getting video as blob
ipcMain.handle('get-video-as-blob', async (_event, videoPath: string) => {
  try {
    const fs = await import('fs/promises');
    
    // Handle direct path or file:// URL
    let filePath = videoPath;
    if (videoPath.startsWith('file:///')) {
      filePath = decodeURIComponent(videoPath.replace('file:///', ''));
    }
    
    // Normalize path
    filePath = path.normalize(filePath);
    
    console.log('Reading video file from:', filePath);
    
    // Read the file as a buffer
    const buffer = await fs.readFile(filePath);
    console.log(`Read ${buffer.length} bytes from video file`);
    
    return buffer;
  } catch (error: any) {
    console.error('Error reading video file:', videoPath, error);
    return null;
  }
});

// Add handler for opening video in external player
ipcMain.handle('open-video-in-external', async (_event, videoPath: string) => {
  try {
    console.log('Opening external video player for:', videoPath);
    
    // Extract file path from URL if needed
    let filePath = videoPath;
    if (videoPath.startsWith('file:///')) {
      filePath = decodeURIComponent(videoPath.replace('file:///', ''));
    }
    
    // For blob URLs, there's nothing we can do directly
    if (videoPath.startsWith('blob:')) {
      throw new Error('Cannot open blob URLs in external player');
    }
    
    // Open with system default application
    const result = await shell.openPath(filePath);
    
    // shell.openPath returns empty string on success, or an error message
    if (result === '') {
      return { success: true };
    } else {
      throw new Error(result);
    }
  } catch (error: any) {
    console.error('Error opening video in external player:', error);
    return { success: false, error: error.message };
  }
});
