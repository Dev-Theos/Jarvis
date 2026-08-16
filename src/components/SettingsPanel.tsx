import { FormEvent, useState } from 'react';
import type { ModelPreference, PublicSettings } from '../types';
import { ModelSelect } from './ModelSelect';

function SecretField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="secret-field">
      <span className="secret-field__label">{label}</span>
      <div className="secret-field__row">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          data-1p-ignore
          data-lpignore="true"
        />
        <button
          type="button"
          className="ghost secret-field__toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide key' : 'Show key'}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      <span className="secret-field__hint">Paste with Ctrl/Cmd+V or right-click → Paste</span>
    </label>
  );
}

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
  const [fishKey, setFishKey] = useState('');
  const [fishRef, setFishRef] = useState(settings.fishReferenceId);
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
      if (llmKey.trim()) patch.llmApiKey = llmKey.trim();
      if (anthropicKey.trim()) patch.anthropicApiKey = anthropicKey.trim();
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
        <SecretField
          label={`LLM API key ${settings.hasLlmKey ? '(set)' : '(missing)'}`}
          value={llmKey}
          onChange={setLlmKey}
          placeholder="Paste key, or leave blank to keep existing"
        />
        <SecretField
          label={`Anthropic API key ${settings.hasAnthropicKey ? '(set)' : '(optional)'}`}
          value={anthropicKey}
          onChange={setAnthropicKey}
          placeholder="Paste key, or leave blank to keep existing"
        />
        <SecretField
          label={`Fish Audio API key ${settings.hasFishKey ? '(set)' : '(optional)'}`}
          value={fishKey}
          onChange={setFishKey}
          placeholder="Paste key, or leave blank to keep existing"
        />
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
