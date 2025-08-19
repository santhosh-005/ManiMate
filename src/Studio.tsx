import { useState } from 'react';
import { 
  History, 
  Save, 
  Settings, 
  Play, 
  Clock, 
  Download,
  MoreVertical,
  Menu
} from 'lucide-react';

// Main App Component
export default function ManiMateApp() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Dummy history data - in real app this would come from your electron IPC handler
  const recentVideos = [
    { id: 1, title: "3D Sine Wave Animation", timestamp: "Today, 2:45 PM", thumbnail: "https://therossiterstretching.com/wp-content/uploads/2022/11/video-placeholder.jpg" },
    { id: 2, title: "Particle Physics Simulation", timestamp: "Today, 1:30 PM", thumbnail: "https://therossiterstretching.com/wp-content/uploads/2022/11/video-placeholder.jpg" },
    { id: 3, title: "Fibonacci Sequence Visualization", timestamp: "Yesterday, 4:20 PM", thumbnail: "https://therossiterstretching.com/wp-content/uploads/2022/11/video-placeholder.jpg" },
    { id: 4, title: "Quantum Mechanics Explanation", timestamp: "Yesterday, 11:15 AM", thumbnail: "https://therossiterstretching.com/wp-content/uploads/2022/11/video-placeholder.jpg" },
    { id: 5, title: "Network Graph Animation", timestamp: "May 7, 3:30 PM", thumbnail: "https://therossiterstretching.com/wp-content/uploads/2022/11/video-placeholder.jpg" },
    { id: 6, title: "Pendulum Wave Demo", timestamp: "May 7, 10:45 AM", thumbnail: "https://therossiterstretching.com/wp-content/uploads/2022/11/video-placeholder.jpg" },
  ];

  // Currently selected video (default to most recent)
  const [currentVideo, setCurrentVideo] = useState(recentVideos[0]);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    // In the real app, this would trigger your Electron IPC to generate the animation
    setTimeout(() => {
      setIsGenerating(false);
      // Handle the new video being added to history
    }, 3000);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-[#1E2E63] to-[#262624] text-gray-100 border border-red-500">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-[#262624]/70 backdrop-blur-sm">
        <div className="text-2xl font-bold text-white">ManiMate</div>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-[#606CC0]/30 transition-colors">
            <Settings size={20} className="text-gray-300" />
          </button>
          <div className="h-10 w-10 rounded-full bg-gray-300 cursor-pointer overflow-hidden">
            <img src="/api/placeholder/40/40" alt="User profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 p-4 gap-6 overflow-hidden">
        {/* Video Player Section */}
        <div className="flex-1 flex flex-col bg-[#262624]/50 rounded-lg overflow-hidden">
          <div className="relative flex-1 bg-black/30 flex items-center justify-center">
            {currentVideo ? (
              <img 
                src={currentVideo.thumbnail} 
                alt={currentVideo.title} 
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-gray-400 text-center">
                <p>No video selected</p>
                <p className="text-sm">Create a new animation using the prompt below</p>
              </div>
            )}
            
            {/* Video Controls Overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">{currentVideo?.title || "No video"}</h3>
                <p className="text-sm text-gray-400">{currentVideo?.timestamp}</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 rounded-full bg-[#606CC0]/80 hover:bg-[#606CC0] transition-colors">
                  <Play size={20} />
                </button>
                <button className="p-2 rounded-full bg-[#262624]/80 hover:bg-[#262624] transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Prompt Input Section */}
          <div className="p-4 border-t border-gray-700/50">
            <div className="relative">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your animation..."
                className="w-full p-4 pr-24 rounded-full bg-[#1E2E63]/60 backdrop-blur-sm border border-[#606CC0]/30 focus:outline-none focus:border-[#606CC0] transition-colors placeholder:text-gray-400"
              />
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className={`absolute right-2 top-2 px-4 py-2 rounded-full ${
                  isGenerating || !prompt.trim() 
                    ? 'bg-[#606CC0]/50 cursor-not-allowed' 
                    : 'bg-[#606CC0] hover:bg-[#606CC0]/80'
                } transition-colors`}
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Right Panel - History and Options */}
        <div className="w-72 flex flex-col gap-4">
          {/* History Section */}
          <div className="bg-[#262624]/50 rounded-lg p-4 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium flex items-center gap-2">
                <History size={18} /> Recent Animations
              </h2>
              <button className="text-sm text-[#606CC0] hover:text-[#606CC0]/80">
                View All
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-2">
              <div className="grid grid-cols-2 gap-3">
                {recentVideos.map((video) => (
                  <div 
                    key={video.id}
                    onClick={() => setCurrentVideo(video)}
                    className={`cursor-pointer rounded-md overflow-hidden border-2 transition-all ${
                      currentVideo?.id === video.id 
                        ? 'border-[#606CC0] scale-[1.02]' 
                        : 'border-transparent hover:border-[#606CC0]/50'
                    }`}
                  >
                    <div className="relative">
                      <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        className="w-full aspect-video object-cover"
                      />
                      <div className="absolute bottom-1 right-1 bg-black/70 text-xs px-1 rounded-sm flex items-center">
                        <Clock size={12} className="mr-1" /> {video.timestamp.split(',')[0]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="bg-[#262624]/50 rounded-lg p-4">
            <h2 className="font-medium mb-3">Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center justify-center p-3 bg-[#1E2E63]/70 rounded-lg hover:bg-[#1E2E63] transition-colors">
                <Save size={20} className="mb-1" />
                <span className="text-sm">Save</span>
              </button>
              <button className="flex flex-col items-center justify-center p-3 bg-[#1E2E63]/70 rounded-lg hover:bg-[#1E2E63] transition-colors">
                <Download size={20} className="mb-1" />
                <span className="text-sm">Download</span>
              </button>
              <button className="flex flex-col items-center justify-center p-3 bg-[#1E2E63]/70 rounded-lg hover:bg-[#1E2E63] transition-colors">
                <Menu size={20} className="mb-1" />
                <span className="text-sm">Menu</span>
              </button>
              <button className="flex flex-col items-center justify-center p-3 bg-[#1E2E63]/70 rounded-lg hover:bg-[#1E2E63] transition-colors">
                <Settings size={20} className="mb-1" />
                <span className="text-sm">Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}