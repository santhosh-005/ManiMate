import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// Get the __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory where   animation outputs will be stored
const OUTPUT_DIR = path.join(os.tmpdir(), 'temp-manimate');

// Path to the bundled Python & ffmpeg executable
function getPythonPath(): string {
  const resourcesPath = process.env.NODE_ENV === 'development'
    ? path.join(__dirname, '..', 'resources')
    : path.join(process.resourcesPath);

  return process.platform === 'win32'
    ? path.join(resourcesPath, 'python', 'Scripts', 'python.exe')
    : path.join(resourcesPath, 'python', 'bin', 'python');
}

function getFFmpegDir(): string {
  const resourcesPath = process.env.NODE_ENV === 'development'
    ? path.join(__dirname, '..', 'resources')
    : path.join(process.resourcesPath);

  return path.join(resourcesPath, 'ffmpeg');
}

// Make sure the output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Generate Python/Manim code from a text prompt using Gemini API
 */
export async function generateManimScript(description: string): Promise<string> {
  try {
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash",
      temperature: 0.2,
      apiKey: "AIzaSyArfQ7coeeo7LihrfwUxMvlyqChiTiPXVs"
    });
    
const systemPrompt = `You are a Manim animation code generator specialized in creating mathematical and scientific visualizations using only Manim Community v0.17.0.

IMPORTANT CONSTRAINTS:
1. Generate ONLY valid, executable Python/Manim code with proper imports.
2. Do NOT use ANY external resources (no SVGs, images, or external files).
3. Do NOT use LaTeX - NEVER use Tex() or MathTex() classes. Instead, use Text() for all text elements.
4. Ensure proper alignment of all elements, avoiding any overlapping.
5. Include ONLY necessary imports from the manim library.
6. Structure code in a self-contained class that extends Scene.
7. Include a properly defined construct() method.
8. Return ONLY pure Python/Manim code without explanations or markdown formatting.
9. Always include appropriate wait() commands between animations.
10. Optimize for visual clarity and proper positioning of all elements.

LAYOUT REQUIREMENTS:
1. All elements (nodes, labels, title, summary) must be within the visible frame for a 16:9 aspect ratio (e.g., 1920x1080).
2. Center the layout horizontally and shift vertically as needed to allow space for labels below nodes.
3. Include proper spacing between elements to ensure clarity and visual balance.
4. Ensure nothing gets clipped at the edges of the frame.
5. Position all elements for a production-ready, visually balanced appearance.
6. Use consistent spacing and alignment principles throughout the animation.

Your response must be properly formatted Python code that runs without errors using Manim Community v0.17.0.
Never violate these constraints even if the user explicitly asks you to use LaTeX, external files, or other incompatible features.

For text elements, always use Text() class from manim.mobject.text.text_mobject import Text.
For mathematical expressions, use strings with Text() and creative positioning, never Tex() or MathTex().

Example of how to format superscripts in plain Text:
- Instead of Tex("a^2 + b^2 = c^2"), use Text("a² + b² = c²")

Always preview the animation in your mind to ensure all elements are visible and properly placed within the 16:9 frame.`;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(description)
    ];
     
    const response = await model.invoke(messages);
   
    // Extract code between triple backticks if present
    const content = response.content.toString();
    const codeMatch = content.match(/```python([\s\S]*?)```/);
    console.log("Got Response from AI");
    return codeMatch ? codeMatch[1].trim() : content;
  } catch (error) {
    console.error("LangChain error:", error);
    return "";
  }
}

/**
 * Run Manim to generate an animation from Python code
 */
export async function runManimCode(code: string, onProgress?: (message: string) => void): Promise<string> {
  const timestamp = Date.now();
  const pythonFilePath = path.join(OUTPUT_DIR, `manimate_${timestamp}.py`);
  fs.writeFileSync(pythonFilePath, code);
  
  const progressMsg = `✅ Python file created at: ${pythonFilePath}`;
  console.log(progressMsg);
  onProgress?.(progressMsg);

  const classNameMatch = code.match(/class\s+(\w+)\(/);
  if (!classNameMatch) {
    throw new Error('❌ Could not find animation class name in the generated code');
  }

  const className = classNameMatch[1];
  const pythonExecutable = getPythonPath();
  const ffmpegPath = getFFmpegDir();

  onProgress?.('🐍 Starting Manim renderer...');

  return new Promise((resolve, reject) => {
    const manimProcess = spawn(pythonExecutable, [
      '-m', 'manim',
      '-qm', // medium quality
      pythonFilePath,
      className
    ], {
      cwd: OUTPUT_DIR,
      env: {
        ...process.env,
        PATH: `${ffmpegPath}${path.delimiter}${process.env.PATH || ''}`,
      },
    });

    let output = '';
    manimProcess.stdout.on('data', (data) => {
      const message = data.toString();
      output += message;
      console.log(`[Manim]: ${message}`);
      
      // Send meaningful progress updates
      if (message.includes('Rendering frame')) {
        onProgress?.('🎬 Rendering animation frames...');
      } else if (message.includes('Writing to')) {
        onProgress?.('💾 Writing video file...');
      } else if (message.includes('File ready')) {
        onProgress?.('✨ Animation ready!');
      }
    });

    manimProcess.stderr.on('data', (data) => {
      const errorMsg = `[Manim Error]: ${data}`;
      console.error(errorMsg);
      onProgress?.(errorMsg);
    });

    manimProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`❌ Manim exited with code ${code}`));
      }

      console.log('✅ Video generation successful');
      onProgress?.('✅ Video generation completed successfully!');

      const baseFileName = path.basename(pythonFilePath, '.py');
      const videoDir = path.join(OUTPUT_DIR, 'media', 'videos', baseFileName, '720p30');

      try {
        const files = fs.readdirSync(videoDir);
        const videoFile = files.find(f => f.endsWith('.mp4'));
        if (videoFile) {
          const videoPath = path.join(videoDir, videoFile);
          onProgress?.(`📁 Video saved: ${videoPath}`);
          resolve(videoPath);
        } else {
          reject(new Error(`❌ No .mp4 file found in ${videoDir}`));
        }
      } catch (err) {
        console.error('❌ Error reading video directory:', err);
        reject(err);
      }
    });
  });
}

/**
 * Generate an animation from a text prompt
 */
export async function generateAnimation(prompt: string, onProgress?: (message: string) => void): Promise<{ videoPath: string, code: string }> {
  try {
    onProgress?.('🤖 Generating Manim code with AI...');
    
    // Step 1: Generate Manim code using Gemini
    const manimCode = await generateManimScript(prompt);
    onProgress?.('📝 Manim code generated successfully!');
    
    // Step 2: Run Manim to create the animation
    const videoPath = await runManimCode(manimCode, onProgress);
    console.log("Final Video path", videoPath)
    
    return { videoPath, code: manimCode };
  } catch (error) {
    console.error('Error generating animation:', error);
    onProgress?.(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}