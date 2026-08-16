import { FormEvent, useState } from 'react';
import type { ModelPreference, PublicSettings } from '../types';
import { ModelSelect } from './ModelSelect';

export function SettingsPanel({
  settings,
  onClose,
  onSave,
}: {
  settings: PublicSettings;
  onClose: () => void;
  onSave: (patch: Record<string, unknown>) => Promise<void>;
}) {
  const [wake, setWake] = useState(settings.wakePhrases.join(', '));
  const [address, setAddress] = useState(settings.userAddress);
  const [voiceOut, setVoiceOut] = useState(settings.voiceOutputEnabled);
  const [modelPref, setModelPref] = useState<ModelPreference>(settings.modelPreference);
  const [llmKey, setLlmKey] = useState('');
  const [baseUrl, setBaseUrl] = useState(settings.llmBaseUrl);
  const [anthropicKey, setAnthropicKey] = useState('');
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [fishKey, setFishKey] = useState('');
  const [fishRef, setFishRef] = useState(settings.fishReferenceId);
  const [clearLlm, setClearLlm] = useState(false);
  const [clearAnthropic, setClearAnthropic] = useState(false);
  const [clearOpenRouter, setClearOpenRouter] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const patch: Record<string, unknown> = {
        wakePhrases: wake
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        userAddress: address,
        voiceOutputEnabled: voiceOut,
        modelPreference: modelPref,
        llmBaseUrl: baseUrl,
        fishReferenceId: fishRef,
      };
      if (modelPref.startsWith('openrouter:')) {
        patch.openRouterModel = modelPref.slice('openrouter:'.length);
      }
      if (llmKey.trim()) patch.llmApiKey = llmKey.trim();
      else if (clearLlm) patch.llmApiKey = '';
      if (anthropicKey.trim()) patch.anthropicApiKey = anthropicKey.trim();
      else if (clearAnthropic) patch.anthropicApiKey = '';
      if (openRouterKey.trim()) patch.openRouterApiKey = openRouterKey.trim();
      else if (clearOpenRouter) patch.openRouterApiKey = '';
      if (fishKey.trim()) patch.fishApiKey = fishKey.trim();
      await onSave(patch);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside className="drawer drawer--wide">
      <div className="drawer__head">
        <h2>Settings</h2>
        <button type="button" className="ghost" onClick={onClose}>
          Close
        </button>
      </div>
      <form className="settings" onSubmit={(e) => void submit(e)}>
        <label>
          Wake phrases (comma-separated)
          <input value={wake} onChange={(e) => setWake(e.target.value)} />
        </label>
        <label>
          Address style
          <input value={address} onChange={(e) => setAddress(e.target.value)} />
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={voiceOut}
            onChange={(e) => setVoiceOut(e.target.checked)}
          />
          Voice output enabled
        </label>
        <ModelSelect
          value={modelPref}
          settings={settings}
          onSelect={setModelPref}
          id="settings-llm-select"
          label="Active LLM"
        />
        <label>
          OpenAI-compatible base URL
          <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
        </label>
        <label>
          LLM API key {settings.hasLlmKey ? '(set)' : '(missing)'}
          <input
            type="password"
            value={llmKey}
            onChange={(e) => setLlmKey(e.target.value)}
            placeholder="Leave blank to keep existing"
            autoComplete="off"
            disabled={clearLlm}
          />
        </label>
        {settings.hasLlmKey && (
          <label className="check check--clear">
            <input
              type="checkbox"
              checked={clearLlm}
              onChange={(e) => setClearLlm(e.target.checked)}
            />
            Clear saved LLM key
          </label>
        )}
        <label>
          Anthropic API key {settings.hasAnthropicKey ? '(set)' : '(optional)'}
          <input
            type="password"
            value={anthropicKey}
            onChange={(e) => setAnthropicKey(e.target.value)}
            placeholder="Leave blank to keep existing"
            autoComplete="off"
            disabled={clearAnthropic}
          />
        </label>
        {settings.hasAnthropicKey && (
          <label className="check check--clear">
            <input
              type="checkbox"
              checked={clearAnthropic}
              onChange={(e) => setClearAnthropic(e.target.checked)}
            />
            Clear saved Anthropic key
          </label>
        )}
        <label>
          OpenRouter API key {settings.hasOpenRouterKey ? '(set)' : '(optional)'}
          <input
            type="password"
            value={openRouterKey}
            onChange={(e) => setOpenRouterKey(e.target.value)}
            placeholder="sk-or-… (leave blank to keep existing)"
            autoComplete="off"
            disabled={clearOpenRouter}
          />
        </label>
        {settings.hasOpenRouterKey && (
          <label className="check check--clear">
            <input
              type="checkbox"
              checked={clearOpenRouter}
              onChange={(e) => setClearOpenRouter(e.target.checked)}
            />
            Clear saved OpenRouter key
          </label>
        )}
        <label>
          Fish Audio API key {settings.hasFishKey ? '(set)' : '(optional)'}
          <input
            type="password"
            value={fishKey}
            onChange={(e) => setFishKey(e.target.value)}
            placeholder="Leave blank to keep existing"
            autoComplete="off"
          />
        </label>
        <label>
          Fish reference voice ID
          <input value={fishRef} onChange={(e) => setFishRef(e.target.value)} />
        </label>
        <button type="submit" className="send" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </aside>
  );
}
