import type { JarvisSettings } from '../types.js';

export const DEFAULT_SETTINGS: JarvisSettings = {
  wakePhrases: ['jarvis'],
  userAddress: 'sir',
  voiceOutputEnabled: true,
  llmApiKey: process.env.JARVIS_LLM_API_KEY ?? '',
  llmBaseUrl: process.env.JARVIS_LLM_BASE_URL ?? 'https://api.openai.com/v1',
  cheapModel: process.env.JARVIS_LLM_CHEAP_MODEL ?? 'gpt-4o-mini',
  standardModel: process.env.JARVIS_LLM_STANDARD_MODEL ?? 'gpt-4o-mini',
  strongModel: process.env.JARVIS_LLM_STRONG_MODEL ?? 'gpt-4o',
  strongestModel: process.env.JARVIS_LLM_STRONGEST_MODEL ?? 'gpt-4o',
  anthropicApiKey: process.env.JARVIS_ANTHROPIC_API_KEY ?? '',
  anthropicModel: process.env.JARVIS_ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514',
  fishApiKey: process.env.JARVIS_FISH_API_KEY ?? '',
  fishReferenceId: process.env.JARVIS_FISH_REFERENCE_ID ?? '',
};

export function mergeSettings(
  base: JarvisSettings,
  patch: Partial<JarvisSettings>,
): JarvisSettings {
  return {
    ...base,
    ...patch,
    wakePhrases: patch.wakePhrases?.length
      ? patch.wakePhrases.map((p) => p.trim().toLowerCase()).filter(Boolean)
      : base.wakePhrases,
  };
}

/** Settings safe to send to the renderer (no secret values). */
export function publicSettings(settings: JarvisSettings) {
  return {
    wakePhrases: settings.wakePhrases,
    userAddress: settings.userAddress,
    voiceOutputEnabled: settings.voiceOutputEnabled,
    llmBaseUrl: settings.llmBaseUrl,
    cheapModel: settings.cheapModel,
    standardModel: settings.standardModel,
    strongModel: settings.strongModel,
    strongestModel: settings.strongestModel,
    anthropicModel: settings.anthropicModel,
    hasLlmKey: Boolean(settings.llmApiKey),
    hasAnthropicKey: Boolean(settings.anthropicApiKey),
    hasFishKey: Boolean(settings.fishApiKey),
    fishReferenceId: settings.fishReferenceId,
  };
}

/** Persistable settings without raw secrets (flags only). */
export function durableSettings(settings: JarvisSettings): Omit<
  JarvisSettings,
  'llmApiKey' | 'anthropicApiKey' | 'fishApiKey'
> & {
  llmApiKey: '';
  anthropicApiKey: '';
  fishApiKey: '';
} {
  return {
    wakePhrases: settings.wakePhrases,
    userAddress: settings.userAddress,
    voiceOutputEnabled: settings.voiceOutputEnabled,
    llmApiKey: '',
    llmBaseUrl: settings.llmBaseUrl,
    cheapModel: settings.cheapModel,
    standardModel: settings.standardModel,
    strongModel: settings.strongModel,
    strongestModel: settings.strongestModel,
    anthropicApiKey: '',
    anthropicModel: settings.anthropicModel,
    fishApiKey: '',
    fishReferenceId: settings.fishReferenceId,
  };
}
