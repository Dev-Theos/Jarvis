import type { IntentAnalysis, JarvisSettings, ModelChoice, PermissionLevel } from '../types.js';

const CODING =
  /\b(code|coding|website|app|script|refactor|bug|typescript|python|html|css|react|build me)\b/i;
const RESEARCH = /\b(search|research|look up|browse|fetch|news|compare|summarize)\b/i;
const MEMORY = /\b(remember|forget|what do you (know|remember)|memory)\b/i;
const SENSITIVE =
  /\b(delete|call|text|email|message|pay|transfer|password|reservation|book)\b/i;
const COMPLEX =
  /\b(automat|workflow|multi-?step|entire|full|deploy|migrate|overhaul)\b/i;

export function analyzeIntent(text: string): IntentAnalysis {
  const neededTools: string[] = [];
  let intent = 'chat';
  let domain = 'general';
  let difficulty = 0.2;
  let risk: PermissionLevel = 'safe';

  if (MEMORY.test(text)) {
    intent = 'memory';
    domain = 'memory';
    difficulty = 0.25;
    if (/\bforget\b/i.test(text)) {
      neededTools.push('memory_forget');
      risk = 'confirm';
    } else if (/\bremember\b/i.test(text)) {
      neededTools.push('memory_remember');
    } else {
      neededTools.push('memory_recall');
    }
  }

  if (CODING.test(text)) {
    intent = 'coding';
    domain = 'coding';
    difficulty = Math.max(difficulty, 0.7);
    neededTools.push('files_write', 'code_project_scaffold');
    risk = 'confirm';
  }

  if (RESEARCH.test(text)) {
    intent = intent === 'chat' ? 'research' : intent;
    domain = domain === 'general' ? 'research' : domain;
    difficulty = Math.max(difficulty, 0.45);
    neededTools.push('web_fetch');
  }

  if (SENSITIVE.test(text)) {
    risk = /\b(delete|call|pay|transfer)\b/i.test(text) ? 'high_risk' : 'confirm';
    difficulty = Math.max(difficulty, 0.55);
  }

  if (COMPLEX.test(text)) {
    difficulty = Math.max(difficulty, 0.85);
  }

  if (/\b(status|hello|hi|hey|ping|thanks)\b/i.test(text) && text.length < 40) {
    intent = 'smalltalk';
    difficulty = 0.05;
  }

  return {
    intent,
    domain,
    difficulty: Math.min(1, difficulty),
    risk,
    neededTools: [...new Set(neededTools)],
    summary: `${intent}/${domain} @ ${difficulty.toFixed(2)}`,
  };
}

export function selectModel(
  analysis: IntentAnalysis,
  settings: JarvisSettings,
): ModelChoice {
  const hasOpenAI = Boolean(settings.llmApiKey);
  const hasAnthropic = Boolean(settings.anthropicApiKey);
  const hasOpenRouter = Boolean(settings.openRouterApiKey);

  // Explicit user selection overrides automatic routing when its key is set.
  const pref = settings.modelPreference ?? 'auto';
  if (pref === 'anthropic' && hasAnthropic) {
    return {
      tier: 'strong',
      provider: 'anthropic',
      model: settings.anthropicModel,
      reason: 'Manually selected Anthropic',
    };
  }
  if (pref.startsWith('openrouter:') && hasOpenRouter) {
    const model = pref.slice('openrouter:'.length) || settings.openRouterModel;
    return {
      tier: 'strong',
      provider: 'openrouter',
      model,
      reason: 'Manually selected OpenRouter model',
    };
  }
  if (pref.startsWith('openai:') && hasOpenAI) {
    const tier = pref.slice('openai:'.length) as Exclude<ModelChoice['tier'], 'local'>;
    const model =
      tier === 'cheap'
        ? settings.cheapModel
        : tier === 'standard'
          ? settings.standardModel
          : tier === 'strong'
            ? settings.strongModel
            : settings.strongestModel;
    return {
      tier,
      provider: 'openai_compatible',
      model,
      reason: `Manually selected ${tier} model`,
    };
  }

  if (!hasOpenAI && !hasAnthropic) {
    // Fall back to OpenRouter when it is the only configured provider.
    if (hasOpenRouter) {
      return {
        tier: 'strong',
        provider: 'openrouter',
        model: settings.openRouterModel,
        reason: 'Only OpenRouter key available',
      };
    }
    return {
      tier: 'local',
      provider: 'local',
      model: 'local-rules',
      reason: 'No cloud API keys configured',
    };
  }

  let tier: ModelChoice['tier'] = 'cheap';
  if (analysis.difficulty >= 0.85) tier = 'strongest';
  else if (analysis.difficulty >= 0.6) tier = 'strong';
  else if (analysis.difficulty >= 0.3) tier = 'standard';

  if (analysis.domain === 'coding' && tier === 'cheap') tier = 'strong';
  if (analysis.intent === 'smalltalk' || analysis.intent === 'memory') tier = 'cheap';

  if (hasAnthropic && (tier === 'strong' || tier === 'strongest') && analysis.domain === 'coding') {
    return {
      tier,
      provider: 'anthropic',
      model: settings.anthropicModel,
      reason: 'Coding/reasoning prefers Anthropic when configured',
    };
  }

  if (!hasOpenAI && hasAnthropic) {
    return {
      tier,
      provider: 'anthropic',
      model: settings.anthropicModel,
      reason: 'Only Anthropic key available',
    };
  }

  const model =
    tier === 'cheap'
      ? settings.cheapModel
      : tier === 'standard'
        ? settings.standardModel
        : tier === 'strong'
          ? settings.strongModel
          : settings.strongestModel;

  return {
    tier,
    provider: 'openai_compatible',
    model,
    reason: `Difficulty ${analysis.difficulty.toFixed(2)} → ${tier}`,
  };
}
