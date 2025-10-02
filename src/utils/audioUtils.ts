// Audio utilities for Deepgram STT (24kHz PCM16) and ElevenLabs TTS (MP3)

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: string) => void) {}

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.audioContext = new AudioContext({
        sampleRate: 24000,
      });
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = this.floatTo16BitPCM(inputData);
        const base64Audio = this.arrayBufferToBase64(pcm16.buffer);
        this.onAudioData(base64Audio);
      };
      
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      
      console.log('[AudioRecorder] Recording started - PCM16 @ 24kHz');
    } catch (error) {
      console.error('[AudioRecorder] Error accessing microphone:', error);
      throw error;
    }
  }

  private floatTo16BitPCM(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const uint8Array = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  }

  stop() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    console.log('[AudioRecorder] Recording stopped');
  }
}

export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private queue: Blob[] = [];
  private isPlaying = false;
  private currentAudio: HTMLAudioElement | null = null;
  private processingQueue = false;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    console.log('[AudioPlayer] Initialized with sequential playback');
  }

  async addToQueue(base64Audio: string) {
    try {
      // Convert base64 MP3 to Blob
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      this.queue.push(blob);
      
      console.log('[AudioPlayer] Added to queue. Total in queue:', this.queue.length, 'Playing:', this.isPlaying);
      
      // Only start playing if not already processing
      if (!this.isPlaying && !this.processingQueue) {
        this.processingQueue = true;
        await this.playNext();
      }
    } catch (error) {
      console.error('[AudioPlayer] Error adding to queue:', error);
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.processingQueue = false;
      console.log('[AudioPlayer] Queue empty, playback complete');
      return;
    }

    // Ensure previous audio is stopped
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    this.isPlaying = true;
    const audioBlob = this.queue.shift()!;

    try {
      const audioUrl = URL.createObjectURL(audioBlob);
      this.currentAudio = new Audio(audioUrl);
      
      // Wait for audio to be ready
      await new Promise<void>((resolve, reject) => {
        this.currentAudio!.oncanplaythrough = () => resolve();
        this.currentAudio!.onerror = (error) => reject(error);
        this.currentAudio!.load();
      });

      console.log('[AudioPlayer] Playing chunk. Remaining:', this.queue.length);
      
      // Play and wait for completion
      await new Promise<void>((resolve) => {
        this.currentAudio!.onended = () => {
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          resolve();
        };
        
        this.currentAudio!.onerror = (error) => {
          console.error('[AudioPlayer] Playback error:', error);
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          resolve(); // Continue to next chunk
        };
        
        this.currentAudio!.play().catch((error) => {
          console.error('[AudioPlayer] Play error:', error);
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          resolve(); // Continue to next chunk
        });
      });
      
      // Play next chunk
      await this.playNext();
      
    } catch (error) {
      console.error('[AudioPlayer] Error in playback:', error);
      // Continue to next chunk even on error
      await this.playNext();
    }
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    this.queue = [];
    this.isPlaying = false;
    this.processingQueue = false;
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    console.log('[AudioPlayer] Stopped and cleared queue');
  }
}

// Legacy utility functions for compatibility
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
