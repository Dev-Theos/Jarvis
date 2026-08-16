import { useEffect, useMemo, useRef, useState } from 'react';
import type { ModelPreference, PublicSettings } from '../types';

/** A small curated set of popular OpenRouter models; any id can also be typed. */
const OPENROUTER_MODELS = [
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3.7-sonnet',
  'google/gemini-2.0-flash-001',
  'google/gemini-flash-1.5',
  'meta-llama/llama-3.1-70b-instruct',
  'mistralai/mistral-large',
  'deepseek/deepseek-chat',
];

type Option = { value: ModelPreference; label: string; available: boolean };

function buildOptions(settings: PublicSettings): Option[] {
  const openai = settings.hasLlmKey;
  const anthropic = settings.hasAnthropicKey;
  const openrouter = settings.hasOpenRouterKey;
  const opts: Option[] = [
    { value: 'auto', label: 'Auto — route by task', available: true },
    { value: 'openai:cheap', label: `OpenAI · Cheap (${settings.cheapModel})`, available: openai },
    { value: 'openai:standard', label: `OpenAI · Standard (${settings.standardModel})`, available: openai },
    { value: 'openai:strong', label: `OpenAI · Strong (${settings.strongModel})`, available: openai },
    { value: 'openai:strongest', label: `OpenAI · Strongest (${settings.strongestModel})`, available: openai },
    { value: 'anthropic', label: `Anthropic (${settings.anthropicModel})`, available: anthropic },
  ];
  for (const m of OPENROUTER_MODELS) {
    opts.push({ value: `openrouter:${m}`, label: `OpenRouter · ${m}`, available: openrouter });
  }
  return opts;
}

export function labelForPreference(value: ModelPreference, settings: PublicSettings): string {
  const found = buildOptions(settings).find((o) => o.value === value);
  if (found) return found.label;
  if (value.startsWith('openrouter:')) return `OpenRouter · ${value.slice('openrouter:'.length)}`;
  return 'Auto — route by task';
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
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement | null>(null);

  const options = useMemo(() => buildOptions(settings), [settings]);
  const q = query.trim().toLowerCase();
  const filtered = options.filter(
    (o) => !q || o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
  );

  const rawQuery = query.trim();
  const customValue = `openrouter:${rawQuery}` as ModelPreference;
  const showCustom =
    Boolean(rawQuery) &&
    settings.hasOpenRouterKey &&
    !options.some((o) => o.value === customValue);

  const noKeys = !settings.hasLlmKey && !settings.hasAnthropicKey && !settings.hasOpenRouterKey;

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  function choose(v: ModelPreference) {
    onSelect(v);
    setOpen(false);
    setQuery('');
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const first = filtered.find((o) => o.available);
      if (first) choose(first.value);
      else if (showCustom) choose(customValue);
    }
  }

  return (
    <div className="model-select" ref={rootRef}>
      <span className="model-select__label" id={`${id}-label`}>
        {label}
      </span>
      <button
        type="button"
        id={id}
        className="model-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="model-select__value">{labelForPreference(value, settings)}</span>
        <span className="model-select__chevron" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div className="model-select__popover">
          <input
            className="model-select__search"
            type="text"
            autoFocus
            placeholder="Search models…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Search models"
          />
          <ul className="model-select__list" role="listbox" aria-labelledby={`${id}-label`}>
            {filtered.length === 0 && !showCustom && (
              <li className="model-select__empty">No matching models</li>
            )}
            {filtered.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o.value === value}
                  className="model-select__option"
                  disabled={!o.available}
                  onClick={() => choose(o.value)}
                >
                  <span>{o.label}</span>
                  {o.available ? (
                    o.value === value && <span className="model-select__check">✓</span>
                  ) : (
                    <small className="model-select__req">key required</small>
                  )}
                </button>
              </li>
            ))}
            {showCustom && (
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  className="model-select__option model-select__option--custom"
                  onClick={() => choose(customValue)}
                >
                  Use OpenRouter model “{rawQuery}”
                </button>
              </li>
            )}
          </ul>
        </div>
      )}

      {noKeys && (
        <small className="model-select__hint">
          Add a provider key in Settings to select a cloud model.
        </small>
      )}
    </div>
  );
}
