import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

/**
 * Pro Video Generation Service (V5.2.1)
 * High-performance browser-side FFmpeg rendering.
 */
class VideoService {
  constructor() {
    this.ffmpeg = new FFmpeg();
    this.loaded = false;
    
    // DropAI Curated Royalty-Free Library
    this.musicLibrary = {
      tech: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a7315b.mp3', // Deep Tech
      lifestyle: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3', // Chill Lofi
      viral: 'https://cdn.pixabay.com/audio/2023/06/15/audio_5b38290332.mp3', // Upbeat Energy
      beauty: 'https://cdn.pixabay.com/audio/2022/10/04/audio_92468307db.mp3', // Fashion Pop
      default: 'https://cdn.pixabay.com/audio/2022/03/15/audio_27607a0d4c.mp3' // Modern Corporate
    };
  }

  async load() {
    if (this.loaded) return;
    
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    try {
      const fontUrl = 'https://raw.githubusercontent.com/googlefonts/roboto/main/src/hinted/Roboto-Bold.ttf';
      await this.ffmpeg.writeFile('font.ttf', await fetchFile(fontUrl));
    } catch (e) {
      console.warn("Font loading failed, falling back to default", e);
    }
    
    this.loaded = true;
  }

  /**
   * AI-driven music selection based on product niche.
   */
  getAISelectedMusic(category = 'default') {
    const cat = category.toLowerCase();
    if (cat.includes('tech') || cat.includes('gadget') || cat.includes('phone')) return this.musicLibrary.tech;
    if (cat.includes('beaut') || cat.includes('skin') || cat.includes('glow')) return this.musicLibrary.beauty;
    if (cat.includes('home') || cat.includes('kitchen') || cat.includes('decor')) return this.musicLibrary.lifestyle;
    if (cat.includes('viral') || cat.includes('trend') || cat.includes('fun')) return this.musicLibrary.viral;
    return this.musicLibrary.default;
  }

  async generateProAd(images, scenes, onProgress, productCategory = 'default') {
    if (!this.loaded) await this.load();

    this.ffmpeg.on('log', ({ message }) => console.log("[FFmpeg Log]", message));
    this.ffmpeg.on('progress', ({ progress }) => {
      if (onProgress) onProgress(Math.round(progress * 100));
    });

    try {
      for (let i = 0; i < images.length; i++) {
          const imgData = await fetch(images[i]).then(res => res.arrayBuffer());
          await this.ffmpeg.writeFile(`img${i}.jpg`, new Uint8Array(imgData));
      }

      // 🎨 Elite Production Filters
      const filterParts = [];
      const sceneDuration = 3.5;
      const fadeDuration = 0.6;
      const transitions = ['circleopen', 'pixelize', 'radial', 'slideleft', 'slideright', 'wipeup', 'hblur'];

      for (let i = 0; i < images.length; i++) {
          const text = (scenes[i] || "").toUpperCase().replace(/'/g, "\\'").replace(/:/g, "\\:");
          
          // ✨ Dynamic Text Motion: Text slides in from bottom and stays
          // 🎭 Cinematic Color: Subtle vignette + slight saturation boost
          filterParts.push(
              `[${i}:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1,` +
              `vignette=angle=0.3,eq=saturation=1.2:contrast=1.1,` +
              `zoompan=z='min(zoom+0.001,1.3)':d=${sceneDuration*25}:s=720x1280,` +
              `drawtext=fontfile=font.ttf:text='${text}':fontcolor=white:fontsize=62:x=(w-text_w)/2:y='h-450-min(t*150, 150)':` +
              `shadowcolor=black@0.9:shadowx=8:shadowy=8:borderw=5:bordercolor=black@0.5[v${i}]`
          );
      }
      
      // 🚀 Elite XFADE Sequence with Randomized Transitions
      let complexFilter = filterParts.join(';');
      let lastV = 'v0';
      let offset = sceneDuration - fadeDuration;

      for (let i = 1; i < images.length; i++) {
          const nextV = `v${i}`;
          const outV = `xf${i}`;
          const transition = transitions[i % transitions.length];
          complexFilter += `; [${lastV}][${nextV}]xfade=transition=${transition}:duration=${fadeDuration}:offset=${offset}[${outV}]`;
          lastV = outV;
          offset += (sceneDuration - fadeDuration);
      }
      complexFilter += `; [${lastV}]format=yuv420p[v]`;

      try {
          // AI Selected Audio Track (Hardened Load)
          const audioUrl = this.getAISelectedMusic(productCategory);
          console.log("[Elite Engine] Mastering with Soul:", audioUrl);
          const audioData = await fetch(audioUrl).then(res => res.arrayBuffer());
          await this.ffmpeg.writeFile('bg.mp3', new Uint8Array(audioData));
          
          const args = [
              ...images.flatMap((_, i) => ['-loop', '1', '-t', `${sceneDuration}`, '-i', `img${i}.jpg`]),
              '-i', 'bg.mp3',
              '-filter_complex', complexFilter,
              '-map', '[v]',
              '-map', `${images.length}:a`, 
              '-c:v', 'libx264',
              '-c:a', 'aac',
              '-b:a', '192k',
              '-pix_fmt', 'yuv420p',
              '-preset', 'ultrafast',
              '-crf', '18',
              '-t', '24', 
              '-shortest', 
              'output.mp4'
          ];

          await this.ffmpeg.exec(args);
      } catch (audioErr) {
          console.warn("Audio merging failed, falling back to silent video", audioErr);
          await this.ffmpeg.exec([
              ...images.flatMap((_, i) => ['-loop', '1', '-t', `${sceneDuration}`, '-i', `img${i}.jpg`]),
              '-filter_complex', complexFilter,
              '-map', '[v]',
              '-c:v', 'libx264',
              '-pix_fmt', 'yuv420p',
              '-preset', 'ultrafast',
              'output.mp4'
          ]);
      }

      const data = await this.ffmpeg.readFile('output.mp4');
      return URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));

    } catch (error) {
      console.error("FFmpeg Generation Failure", error);
      throw error;
    }
  }
}

export default new VideoService();
