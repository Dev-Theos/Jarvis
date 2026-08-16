import type { JarvisSettings, ModelChoice } from '../types.js';
import { scrubSecrets } from '../security/scrub.js';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMClient {
  complete(messages: LLMMessage[], choice: ModelChoice): Promise<string>;
}

export class MultiProviderLLM implements LLMClient {
  constructor(private getSettings: () => JarvisSettings) {}

  async complete(messages: LLMMessage[], choice: ModelChoice): Promise<string> {
    if (choice.provider === 'local') {
      throw new Error('Local provider cannot complete LLM requests');
    }
    if (choice.provider === 'anthropic') {
      return this.anthropic(messages, choice.model);
    }
    if (choice.provider === 'openrouter') {
      return this.openrouter(messages, choice.model);
    }
    return this.openaiCompatible(messages, choice.model);
  }

  private async openaiCompatible(messages: LLMMessage[], model: string): Promise<string> {
    const s = this.getSettings();
    const key = (s.llmApiKey ?? '').trim();
    if (!key) throw new Error('Missing OpenAI-compatible API key');
    return this.chatCompletions(
      `${s.llmBaseUrl.replace(/\/$/, '')}/chat/completions`,
      key,
      model,
      messages,
      'OpenAI-compatible',
    );
  }

  private async openrouter(messages: LLMMessage[], model: string): Promise<string> {
    const s = this.getSettings();
    const key = (s.openRouterApiKey ?? '').trim();
    if (!key) throw new Error('Missing OpenRouter API key');
    return this.chatCompletions(
      'https://openrouter.ai/api/v1/chat/completions',
      key,
      model,
      messages,
      'OpenRouter',
      {
        // Optional attribution headers recommended by OpenRouter.
        'HTTP-Referer': 'https://github.com/dev-theos/jarvis',
        'X-Title': 'JARVIS',
      },
    );
  }

  private async chatCompletions(
    url: string,
    apiKey: string,
    model: string,
    messages: LLMMessage[],
    providerLabel: string,
    extraHeaders: Record<string, string> = {},
  ): Promise<string> {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
        ...extraHeaders,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.4,
      }),
    });
    if (!res.ok) {
      const body = scrubSecrets(await res.text());
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          `${providerLabel} rejected the API key (${res.status}). ` +
            `Open Settings and re-enter a valid ${providerLabel} key` +
            (providerLabel === 'OpenRouter' ? ' (it should start with "sk-or-").' : '.'),
        );
      }
      throw new Error(`${providerLabel} error ${res.status}: ${body.slice(0, 400)}`);
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content?.trim() || 'No response from model.';
  }

  private async anthropic(messages: LLMMessage[], model: string): Promise<string> {
    const s = this.getSettings();
    const key = (s.anthropicApiKey ?? '').trim();
    if (!key) throw new Error('Missing Anthropic API key');
    const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
    const converted = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        system,
        messages: converted,
      }),
    });
    if (!res.ok) {
      const body = scrubSecrets(await res.text());
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          `Anthropic rejected the API key (${res.status}). Open Settings and re-enter a valid Anthropic key.`,
        );
      }
      throw new Error(`Anthropic error ${res.status}: ${body.slice(0, 400)}`);
    }
    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    return (
      data.content?.filter((c) => c.type === 'text').map((c) => c.text ?? '').join('\n').trim() ||
      'No response from Anthropic.'
    );
  }
}
