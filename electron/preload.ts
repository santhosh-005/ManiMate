const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Animation generation
  exposedGenerateAnimation: (prompt: string) => ipcRenderer.invoke('generate-animation', prompt),
  
  // Save video
  saveVideo: (options: any) => ipcRenderer.invoke('save-video', options),
  
  // Get recent videos
  getRecentVideos: () => ipcRenderer.invoke('get-recent-videos'),
  
  // Get video as blob
  getVideoAsBlob: (videoPath: string) => ipcRenderer.invoke('get-video-as-blob', videoPath),
  
  // Open video in external player
  openVideoInExternal: (videoPath: string) => ipcRenderer.invoke('open-video-in-external', videoPath),
  
  // Progress updates
  onProgress: (callback: (message: string) => void) => {
    ipcRenderer.on('generation-progress', (_event: any, message: string) => callback(message));
  },
  
  // Remove progress listener
  removeProgressListener: () => {
    ipcRenderer.removeAllListeners('generation-progress');
  }
});

