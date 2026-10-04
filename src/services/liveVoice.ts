export interface LiveVoiceSession {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  sendText: (text: string) => void;
}

export class LiveVoiceManager {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private nextStartTime = 0;
  private onStateChange: (state: { isConnected: boolean; isListening: boolean; isSpeaking: boolean; error: string | null }) => void;

  constructor(onStateChange: (state: { isConnected: boolean; isListening: boolean; isSpeaking: boolean; error: string | null }) => void) {
    this.onStateChange = onStateChange;
  }

  public async start(): Promise<void> {
    try {
      this.onStateChange({ isConnected: false, isListening: false, isSpeaking: false, error: null });

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = async () => {
        this.onStateChange({ isConnected: true, isListening: true, isSpeaking: false, error: null });
        await this.initMicrophone();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.error) {
            this.onStateChange({ isConnected: false, isListening: false, isSpeaking: false, error: msg.error });
            return;
          }
          if (msg.audio) {
            this.onStateChange({ isConnected: true, isListening: true, isSpeaking: true, error: null });
            this.playAudioChunk(msg.audio);
          }
          if (msg.interrupted) {
            this.stopPlayback();
          }
        } catch (e) {
          console.error('[LiveVoice] Error parsing WS message:', e);
        }
      };

      this.ws.onerror = (err) => {
        console.error('[LiveVoice] WebSocket error:', err);
        this.onStateChange({ isConnected: false, isListening: false, isSpeaking: false, error: 'Voice connection failed. Please check mic permissions or server.' });
      };

      this.ws.onclose = () => {
        this.cleanUp();
        this.onStateChange({ isConnected: false, isListening: false, isSpeaking: false, error: null });
      };
    } catch (err: any) {
      console.error('[LiveVoice] Start failed:', err);
      this.onStateChange({ isConnected: false, isListening: false, isSpeaking: false, error: err.message || 'Microphone access denied.' });
    }
  }

  private async initMicrophone() {
    this.inputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    const source = this.inputAudioCtx.createMediaStreamSource(this.mediaStream);
    this.processor = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const inputData = e.inputBuffer.getChannelData(0);
        const base64Pcm = this.floatTo16BitPCMBase64(inputData);
        this.ws.send(JSON.stringify({ audio: base64Pcm }));
      }
    };

    source.connect(this.processor);
    this.processor.connect(this.inputAudioCtx.destination);
  }

  private playAudioChunk(base64Pcm: string) {
    if (!this.outputAudioCtx) return;

    try {
      const binary = atob(base64Pcm);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const view = new DataView(bytes.buffer);
      const numSamples = bytes.length / 2;
      const audioBuffer = this.outputAudioCtx.createBuffer(1, numSamples, 24000);
      const channelData = audioBuffer.getChannelData(0);

      for (let i = 0; i < numSamples; i++) {
        const s = view.getInt16(i * 2, true);
        channelData[i] = s / 32768.0;
      }

      const source = this.outputAudioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputAudioCtx.destination);

      const startTime = Math.max(this.outputAudioCtx.currentTime, this.nextStartTime);
      source.start(startTime);
      this.nextStartTime = startTime + audioBuffer.duration;

      source.onended = () => {
        if (this.outputAudioCtx && this.outputAudioCtx.currentTime >= this.nextStartTime) {
          this.onStateChange({ isConnected: true, isListening: true, isSpeaking: false, error: null });
        }
      };
    } catch (e) {
      console.error('[LiveVoice] Playback error:', e);
    }
  }

  private stopPlayback() {
    this.nextStartTime = this.outputAudioCtx ? this.outputAudioCtx.currentTime : 0;
    this.onStateChange({ isConnected: true, isListening: true, isSpeaking: false, error: null });
  }

  private floatTo16BitPCMBase64(channelData: Float32Array): string {
    const l = channelData.length;
    const buffer = new ArrayBuffer(l * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < l; i++) {
      const s = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  public sendText(text: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ text }));
    }
  }

  public stop(): void {
    this.cleanUp();
    this.onStateChange({ isConnected: false, isListening: false, isSpeaking: false, error: null });
  }

  private cleanUp(): void {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.inputAudioCtx) {
      this.inputAudioCtx.close().catch(() => {});
      this.inputAudioCtx = null;
    }
    if (this.outputAudioCtx) {
      this.outputAudioCtx.close().catch(() => {});
      this.outputAudioCtx = null;
    }
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }
      this.ws = null;
    }
    this.nextStartTime = 0;
  }
}
