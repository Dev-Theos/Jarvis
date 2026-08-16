import type { JarvisSettings, ModelPreference } from '../types.js';
import { FIXED_MODEL_PREFERENCES } from '../types.js';

function parseModelPreference(value: string | undefined): ModelPreference {
  if (!value) return 'auto';
  if (FIXED_MODEL_PREFERENCES.includes(value as ModelPreference)) {
    return value as ModelPreference;
  }
  if (value.startsWith('openrouter:') && value.length > 'openrouter:'.length) {
    return value as ModelPreference;
  }
  return 'auto';
}

export const DEFAULT_SETTINGS: JarvisSettings = {
  wakePhrases: ['jarvis'],
  userAddress: 'sir',
  voiceOutputEnabled: true,
  modelPreference: parseModelPreference(process.env.JARVIS_MODEL_PREFERENCE),
  llmApiKey: process.env.JARVIS_LLM_API_KEY ?? '',
  llmBaseUrl: process.env.JARVIS_LLM_BASE_URL ?? 'https://api.openai.com/v1',
  cheapModel: process.env.JARVIS_LLM_CHEAP_MODEL ?? 'gpt-4o-mini',
  standardModel: process.env.JARVIS_LLM_STANDARD_MODEL ?? 'gpt-4o-mini',
  strongModel: process.env.JARVIS_LLM_STRONG_MODEL ?? 'gpt-4o',
  strongestModel: process.env.JARVIS_LLM_STRONGEST_MODEL ?? 'gpt-4o',
  anthropicApiKey: process.env.JARVIS_ANTHROPIC_API_KEY ?? '',
  anthropicModel: process.env.JARVIS_ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514',
  openRouterApiKey: process.env.JARVIS_OPENROUTER_API_KEY ?? '',
  openRouterModel: process.env.JARVIS_OPENROUTER_MODEL ?? 'openai/gpt-4o-mini',
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
    modelPreference: settings.modelPreference,
    llmBaseUrl: settings.llmBaseUrl,
    cheapModel: settings.cheapModel,
    standardModel: settings.standardModel,
    strongModel: settings.strongModel,
    strongestModel: settings.strongestModel,
    anthropicModel: settings.anthropicModel,
    openRouterModel: settings.openRouterModel,
    hasLlmKey: Boolean(settings.llmApiKey),
    hasAnthropicKey: Boolean(settings.anthropicApiKey),
    hasOpenRouterKey: Boolean(settings.openRouterApiKey),
    hasFishKey: Boolean(settings.fishApiKey),
    fishReferenceId: settings.fishReferenceId,
  };
}

/** Persistable settings without raw secrets (flags only). */
export function durableSettings(settings: JarvisSettings): Omit<
  JarvisSettings,
  'llmApiKey' | 'anthropicApiKey' | 'fishApiKey' | 'openRouterApiKey'
> & {
  llmApiKey: '';
  anthropicApiKey: '';
  fishApiKey: '';
  openRouterApiKey: '';
} {
  return {
    wakePhrases: settings.wakePhrases,
    userAddress: settings.userAddress,
    voiceOutputEnabled: settings.voiceOutputEnabled,
    modelPreference: settings.modelPreference,
    llmApiKey: '',
    llmBaseUrl: settings.llmBaseUrl,
    cheapModel: settings.cheapModel,
    standardModel: settings.standardModel,
    strongModel: settings.strongModel,
    strongestModel: settings.strongestModel,
    anthropicApiKey: '',
    anthropicModel: settings.anthropicModel,
    openRouterApiKey: '',
    openRouterModel: settings.openRouterModel,
    fishApiKey: '',
    fishReferenceId: settings.fishReferenceId,
  };
}
