import type { ModelPreference, PublicSettings } from '../types';

type Option = {
  value: ModelPreference;
  label: string;
  available: boolean;
};

function buildOptions(settings: PublicSettings): Option[] {
  const openai = settings.hasLlmKey;
  const anthropic = settings.hasAnthropicKey;
  return [
    { value: 'auto', label: 'Auto — route by task', available: true },
    { value: 'openai:cheap', label: `OpenAI · Cheap (${settings.cheapModel})`, available: openai },
    { value: 'openai:standard', label: `OpenAI · Standard (${settings.standardModel})`, available: openai },
    { value: 'openai:strong', label: `OpenAI · Strong (${settings.strongModel})`, available: openai },
    { value: 'openai:strongest', label: `OpenAI · Strongest (${settings.strongestModel})`, available: openai },
    { value: 'anthropic', label: `Anthropic (${settings.anthropicModel})`, available: anthropic },
  ];
}

export function ModelSelect({
  value,
  settings,
  onSelect,
  id = 'llm-select',
  label = 'LLM',
}: {
  value: ModelPreference;
  settings: PublicSettings;
  onSelect: (pref: ModelPreference) => void;
  id?: string;
  label?: string;
}) {
  const options = buildOptions(settings);
  const noKeys = !settings.hasLlmKey && !settings.hasAnthropicKey;

  return (
    <div className="model-select">
      <label className="model-select__label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="model-select__input"
        value={value}
        onChange={(e) => onSelect(e.target.value as ModelPreference)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={!o.available}>
            {o.available ? o.label : `${o.label} — key required`}
          </option>
        ))}
      </select>
      {noKeys && (
        <small className="model-select__hint">
          Add a provider key in Settings to select a cloud model.
        </small>
      )}
    </div>
  );
}
