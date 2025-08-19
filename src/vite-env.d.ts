/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    exposedGenerateAnimation: (prompt: string) => Promise<{
      success: boolean;
      message?: string;
      videoPath?: string;
      code?: string;
    }>;
    saveVideo: (options: {
      buffer: ArrayBuffer;
      defaultName?: string;
    }) => Promise<{
      success: boolean;
      error?: string;
      path?: string;
      message?: string;
    }>;
    getRecentVideos: () => Promise<{
      success: boolean;
      error?: string;
      videos: string[];
    }>;
    getVideoAsBlob: (videoPath: string) => Promise<ArrayBuffer | null>;
    openVideoInExternal: (videoPath: string) => Promise<{
      success: boolean;
      error?: string;
    }>;
    onProgress: (callback: (message: string) => void) => void;
    removeProgressListener: () => void;
  };
}
