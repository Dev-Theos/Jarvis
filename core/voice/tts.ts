export interface TTSProvider {
  name: string;
  isConfigured(): boolean;
  synthesize(text: string, signal?: AbortSignal): Promise<Buffer>;
}

export class FishAudioTTS implements TTSProvider {
  name = 'fish_audio';

  constructor(
    private getApiKey: () => string,
    private getReferenceId: () => string,
  ) {}

  isConfigured(): boolean {
    return Boolean(this.getApiKey());
  }

  async synthesize(text: string, signal?: AbortSignal): Promise<Buffer> {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error('Fish Audio API key not configured');

    const referenceId = this.getReferenceId();
    const body: Record<string, unknown> = {
      text: text.slice(0, 4000),
      format: 'mp3',
    };
    if (referenceId) body.reference_id = referenceId;

    const res = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
        model: 's1',
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Fish Audio TTS failed (${res.status}): ${err.slice(0, 300)}`);
    }
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  }
}

/** Offline stub used when no TTS key is present — returns empty audio marker. */
export class NullTTS implements TTSProvider {
  name = 'null';
  isConfigured(): boolean {
    return false;
  }
  async synthesize(): Promise<Buffer> {
    return Buffer.alloc(0);
  }
}
