import { useState, useRef, useEffect } from 'react';
import { Download, Loader, Film, Sparkles } from 'lucide-react';

function App() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [progressLogs, setProgressLogs] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState('');
  const [recentVideos, setRecentVideos] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [progressLogs]);

  // Set up progress listener
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.onProgress((message: string) => {
        addProgressLog(message);
        
        // Update current step based on message
        if (message.includes('Connecting') || message.includes('Sending')) {
          setCurrentStep('Connecting to AI...');
        } else if (message.includes('Generating') || message.includes('AI')) {
          setCurrentStep('Generating code...');
        } else if (message.includes('Python file')) {
          setCurrentStep('Creating animation...');
        } else if (message.includes('Manim') || message.includes('Rendering')) {
          setCurrentStep('Rendering video...');
        } else if (message.includes('Writing') || message.includes('saved')) {
          setCurrentStep('Finalizing...');
        } else if (message.includes('completed')) {
          setCurrentStep('Complete!');
        }
      });

      // Load recent videos on mount
      loadRecentVideos();
    }

    return () => {
      if (typeof window !== 'undefined' && window.electronAPI) {
        window.electronAPI.removeProgressListener();
      }
    };
  }, []);

  const loadRecentVideos = async () => {
    try {
      if (window.electronAPI) {
        const response = await window.electronAPI.getRecentVideos();
        if (response.success) {
          setRecentVideos(response.videos);
        }
      }
    } catch (error) {
      console.error('Error loading recent videos:', error);
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const addProgressLog = (log: string) => {
    setProgressLogs(prev => [...prev, log]);
  };
  
    // Convert a video path to a blob URL for secure playback
  const convertVideoToBlob = async (videoPath: string): Promise<string | null> => {
    try {
      console.log('Converting video to blob:', videoPath);
      
      // Get video data as blob from main process
      const videoData = await window.electronAPI.getVideoAsBlob(videoPath);
      
      if (videoData) {
        // Create blob from the buffer data
        const blob = new Blob([videoData], { type: 'video/mp4' });
        
        // Create a blob URL
        const blobUrl = URL.createObjectURL(blob);
        console.log('Created blob URL:', blobUrl);
        return blobUrl;
      } else {
        console.error('Failed to get video data from main process');
        return null;
      }
    } catch (error) {
      console.error('Error converting video to blob:', error);
      return null;
    }
  };

  const handleGenerateAnimation = async () => {
    if (!prompt.trim()) {
      setMessage('Please enter a description for your animation.');
      return;
    }

    try {
      setIsGenerating(true);
      setProgressLogs([]);
      setVideoSrc(null);
      setMessage(null);
      
      setCurrentStep('Starting...');
      addProgressLog('🚀 Starting animation generation...');

      // Call the Electron API to generate the animation
      const response = await window.electronAPI.exposedGenerateAnimation(prompt);

      if (response.success && response.videoPath) {
        setCurrentStep('Complete!');
        addProgressLog('✅ Video generation completed!');
        
        try {
          // Try to convert the video to a blob URL
          console.log('Original video path:', response.videoPath);
          addProgressLog('🔄 Converting video to blob URL...');
          
          // Convert the video path to a blob URL
          const blobUrl = await convertVideoToBlob(response.videoPath);
          
          if (blobUrl) {
            console.log('Using blob URL:', blobUrl);
            addProgressLog('✅ Video converted to blob URL successfully');
            
            // Set the video source
            setVideoSrc(blobUrl);
            setMessage('Animation generated successfully!');
            addProgressLog(`🎬 Video ready for playback`);
            
            // Add to recent videos (keep only last 4)
            setRecentVideos(prev => {
              const updated = [response.videoPath!, ...prev.filter(v => v !== response.videoPath)];
              return updated.slice(0, 4);
            });
          } else {
            setMessage('Video generated but failed to convert to blob');
            addProgressLog(`⚠️ Video path: ${response.videoPath}`);
          }
        } catch (error) {
          console.error('Error processing video path:', error);
          addProgressLog(`⚠️ Error preparing video: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        setCurrentStep('Error');
        addProgressLog(`❌ Error: ${response.message || 'Unknown error'}`);
        setMessage(`Error: ${response.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating animation:', error);
      setCurrentStep('Error');
      addProgressLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveVideo = async () => {
    try {
      // Check if we have a video source
      if (!videoSrc) {
        setMessage('No video available to save');
        return;
      }

      addProgressLog('💾 Preparing to save video...');
      
      // Get video element
      if (!videoRef.current) {
        throw new Error('Video element not found');
      }
      
      // Create a blob from the video source
      let videoBlob: Blob;
      
      if (videoSrc.startsWith('blob:')) {
        // For blob URLs, fetch the blob directly
        const response = await fetch(videoSrc);
        videoBlob = await response.blob();
      } else if (videoSrc.startsWith('file:') || videoSrc.startsWith('/') || videoSrc.includes(':\\')) {
        // For file paths, we need to get the video data from the main process
        const arrayBuffer = await window.electronAPI.getVideoAsBlob(videoSrc);
        if (!arrayBuffer) {
          throw new Error('Failed to get video data');
        }
        videoBlob = new Blob([arrayBuffer], { type: 'video/mp4' });
      } else {
        throw new Error('Unsupported video source format');
      }
      
      // Convert Blob to ArrayBuffer
      const buffer = await videoBlob.arrayBuffer();
      
      // Get filename from the path or use default
      const defaultName = videoSrc.includes('/') || videoSrc.includes('\\') 
        ? videoSrc.split(/[/\\]/).pop() || 'myvideo.mp4' 
        : 'myvideo.mp4';
      
      addProgressLog('💾 Saving video...');
      const response = await window.electronAPI.saveVideo({
        buffer,
        defaultName
      });
      
      if (response.success && response.path) {
        addProgressLog(`✅ Video saved to ${response.path}`);
        setMessage(`Video saved to ${response.path}`);
        // Show success alert
        alert(`Video successfully saved to: ${response.path}`);
      } else {
        const errorMessage = response.error || response.message || 'Unknown error';
        addProgressLog(`❌ Error saving video: ${errorMessage}`);
        setMessage(`Error saving video: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error saving video:', error);
      const errorMsg = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      addProgressLog(`❌ ${errorMsg}`);
      setMessage(errorMsg);
    }
  };

  const generateButtonText = () => {
    if (isGenerating) {
      return (
        <span className="flex items-center justify-center gap-2">
          <Loader className="w-4 h-4 animate-spin" />
          {currentStep || 'Generating...'}
        </span>
      );
    }
    return (
      <span className="flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4" />
        Generate Animation
      </span>
    );
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Film className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-bold text-white">ManiMate</h1>
          </div>
          <div className="w-3 h-3 bg-slate-600 rounded-full"></div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-4 min-h-0">
        <div className="max-w-7xl mx-auto h-full flex flex-col gap-4">
          {/* Top Section - Video Area */}
          <div className="flex gap-4 flex-1 min-h-0">
            {/* Main Video Display */}
            <div className="flex-1 bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden relative min-h-0">
              {videoSrc ? (
                <div className="w-full h-full relative">
                  <video
                    ref={videoRef}
                    src={videoSrc}
                    controls
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error('Video error details:', {
                        src: videoSrc,
                        error: e,
                        videoElement: e.target
                      });
                      
                      // Try to extract more detailed error info
                      const videoEl = e.target as HTMLVideoElement;
                      const errorCode = videoEl?.error?.code || 'Unknown';
                      const errorMessage = videoEl?.error?.message || 'Unknown error';
                      
                      console.error(`Detailed video error (code ${errorCode}):`, errorMessage);
                      
                      // Try to reload as blob if it's not already a blob URL
                      if (!videoSrc.startsWith('blob:')) {
                        addProgressLog(`🔄 Trying to reload video as blob...`);
                        
                        // Attempt to convert to blob and reload
                        convertVideoToBlob(videoSrc)
                          .then(blobUrl => {
                            if (blobUrl) {
                              console.log('Converted to blob URL:', blobUrl);
                              addProgressLog(`✅ Converted to blob URL, reloading...`);
                              setVideoSrc(blobUrl);
                            } else {
                              console.error('Failed to convert to blob URL');
                              addProgressLog(`❌ Failed to convert to blob URL`);
                            }
                          })
                          .catch(error => console.error('Error converting to blob:', error));
                      }
                      
                      setMessage(`Error loading video (code ${errorCode}): ${errorMessage}`);
                      addProgressLog(`❌ Video playback error - ${errorMessage}`);
                      
                      // Offer to open externally as fallback
                      addProgressLog(`💡 Try using the "Open External" button to view the video in your default player`);
                    }}
                    onLoadStart={() => {
                      console.log('Video loading started:', videoSrc);
                      addProgressLog('📺 Loading video for playback...');
                    }}
                    onLoadedData={() => {
                      console.log('Video loaded successfully');
                      addProgressLog('✅ Video loaded and ready to play');
                    }}
                    onCanPlay={() => {
                      console.log('Video can start playing');
                    }}
                    preload="metadata"
                  />
                  {/* Debug info and controls */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => {
                        console.log('Current video src:', videoSrc);
                        if (videoRef.current) {
                          console.log('Video element state:', {
                            readyState: videoRef.current.readyState,
                            networkState: videoRef.current.networkState,
                            error: videoRef.current.error
                          });
                          videoRef.current.load();
                        }
                      }}
                      className="px-2 py-1 bg-black/50 text-white rounded text-xs hover:bg-black/70 transition-colors"
                    >
                      Reload
                    </button>
                    {/* <button
                      onClick={async () => {
                        try {
                          // Log what we're trying to open
                          console.log('Opening video externally:', videoSrc);
                          addProgressLog(`🔄 Opening video in external player...`);
                          
                          // Try to open with the external player handler
                          if (window.electronAPI?.openVideoInExternal) {
                            // If it's a blob URL, we need the original path
                            let pathToOpen = videoSrc;
                            
                            // For non-blob URLs, pass the original file path
                            const result = await window.electronAPI.openVideoInExternal(pathToOpen);
                            if (result.success) {
                              addProgressLog(`✅ Video opened in your default player`);
                            } else {
                              addProgressLog(`❌ Error opening video: ${result.error || 'Unknown error'}`);
                            }
                          }
                        } catch (error) {
                          console.error('Error opening external player:', error);
                          addProgressLog(`❌ Failed to open external player`);
                        }
                      }}
                      className="px-2 py-1 bg-black/50 text-white rounded text-xs hover:bg-black/70 transition-colors"
                    >
                      Open External
                    </button> */}
                  </div>
                
                </div>
              ) : isGenerating ? (
                /* Generation Progress Display - Full Size */
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center w-full h-full flex flex-col items-center justify-center px-8">
                    <div className="mb-6">
                      <Loader className="w-16 h-16 mx-auto animate-spin text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-8 text-white">{currentStep || 'Generating Animation...'}</h3>
                    
                    {/* Progress Logs - Full Width, Transparent Background */}
                    <div className="w-full max-w-2xl">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-slate-300">Live Progress</span>
                      </div>
                      
                      {/* Scrollable logs container with hidden scrollbar */}
                      <div className="h-40 overflow-y-auto scrollbar-hide">
                        <div className="space-y-2 text-left">
                          {progressLogs.map((log, index) => (
                            <div key={index} className="text-sm text-slate-300 font-mono px-4 py-1 rounded bg-black/20 backdrop-blur-sm border border-slate-600/30">
                              {log}
                            </div>
                          ))}
                          <div ref={logsEndRef} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Placeholder when no video */
                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <Film className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-xl mb-2">Your animation will appear here</p>
                    <p className="text-sm opacity-75">Enter a description below and click generate</p>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Videos Grid */}
            <div className="w-80 bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 flex flex-col min-h-0">
              <h3 className="text-sm font-semibold mb-3 text-white">Recent Generations</h3>
              <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="bg-slate-900/50 rounded-lg border border-slate-600/50 overflow-hidden aspect-video">
                    {recentVideos[index] ? (
                      <div className="relative w-full h-full">
                        <video
                          src={recentVideos[index]}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={async () => {
                            try {
                              console.log('Loading recent video:', recentVideos[index]);
                              addProgressLog('🔄 Loading recent video...');
                              
                              // Convert to blob URL
                              const blobUrl = await convertVideoToBlob(recentVideos[index]);
                              
                              if (blobUrl) {
                                setVideoSrc(blobUrl);
                                addProgressLog('✅ Recent video loaded');
                              } else {
                                addProgressLog('❌ Failed to load recent video');
                              }
                            } catch (error) {
                              console.error('Error loading recent video:', error);
                              addProgressLog('❌ Error loading recent video');
                            }
                          }}
                          muted
                          preload="none"
                          onError={() => {
                            console.warn('Recent video preview failed to load:', recentVideos[index]);
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" className="opacity-80">
                            <polygon points="5,3 19,12 5,21" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">
                        <Film className="w-6 h-6 opacity-30" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Section - Controls */}
          <div className="flex-shrink-0 grid grid-cols-3 gap-4 h-48">
            {/* Prompt Input */}
            <div className="col-span-2 bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 flex flex-col min-h-0">
              <h2 className="text-sm font-semibold mb-3 text-white">Describe Your Animation</h2>
              
              <div className="flex-1 flex flex-col gap-3 min-h-0">
                <textarea
                  className="flex-1 min-h-0 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400 resize-none text-sm"
                  placeholder="Example: A sine wave transforming into a cosine wave with mathematical labels and smooth transitions"
                  value={prompt}
                  onChange={handlePromptChange}
                  disabled={isGenerating}
                />
                
                {/* Status Messages */}
                {message && (
                  <div className={`p-2 rounded-lg border text-xs flex-shrink-0 ${
                    message.includes('Error') 
                      ? 'bg-red-900/20 border-red-500/30 text-red-300' 
                      : 'bg-green-900/20 border-green-500/30 text-green-300'
                  }`}>
                    {message}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 flex flex-col min-h-0">
              <h3 className="text-sm font-semibold mb-3 text-white">Actions</h3>
              
              <div className="flex-1 flex flex-col gap-3">
                <button
                  onClick={handleGenerateAnimation}
                  disabled={isGenerating || !prompt.trim()}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isGenerating || !prompt.trim()
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25'
                  }`}
                >
                  {generateButtonText()}
                </button>

                {videoSrc && (
                  <button
                    onClick={handleSaveVideo}
                    className="flex-shrink-0 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/25"
                  >
                    <Download className="w-3 h-3" />
                    Save Video
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        `}
      </style>
    </div>
  );
}

export default App;