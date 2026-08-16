import type { ModelPreference, PublicSettings, TaskState } from '../types';
import { ModelSelect } from './ModelSelect';

export function SideRail({
  voiceStatus,
  toolActivity,
  task,
  settings,
  onSelectModel,
}: {
  voiceStatus: string;
  toolActivity: string;
  task: TaskState | null;
  settings: PublicSettings | null;
  onSelectModel: (pref: ModelPreference) => void;
}) {
  return (
    <aside className="rail">
      <h2>Status</h2>
      <dl>
        <div>
          <dt>Voice</dt>
          <dd>{voiceStatus}</dd>
        </div>
        <div>
          <dt>Tool</dt>
          <dd>{toolActivity}</dd>
        </div>
        <div>
          <dt>Models</dt>
          <dd>
            {settings?.hasLlmKey || settings?.hasAnthropicKey ? 'cloud ready' : 'local mode'}
            {settings?.hasFishKey ? ' · TTS ready' : ' · TTS unset'}
          </dd>
        </div>
      </dl>

      {settings && (
        <ModelSelect
          value={settings.modelPreference}
          settings={settings}
          onSelect={onSelectModel}
        />
      )}

      <h2>Current task</h2>
      {!task && <p className="muted">Idle</p>}
      {task && (
        <div className="task">
          <p className="task__title">
            {task.title} · <em>{task.status}</em>
          </p>
          <ul>
            {task.steps.map((s) => (
              <li key={s.id} data-status={s.status}>
                <span>{s.title}</span>
                {s.detail && <small>{s.detail}</small>}
              </li>
            ))}
          </ul>
          <div className="task__bar" data-status={task.status} />
        </div>
      )}
    </aside>
  );
}
