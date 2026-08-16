import type { MemoryRecord } from '../types';

export function MemoryPanel({
  memories,
  onClose,
  onRefresh,
  onDelete,
}: {
  memories: MemoryRecord[];
  onClose: () => void;
  onRefresh: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <aside className="drawer">
      <div className="drawer__head">
        <h2>Memory</h2>
        <div>
          <button type="button" className="ghost" onClick={onRefresh}>
            Refresh
          </button>
          <button type="button" className="ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <ul className="memory-list">
        {memories.length === 0 && <li className="muted">No memories yet.</li>}
        {memories.map((m) => (
          <li key={m.id}>
            <div>
              <strong>{m.title}</strong>
              <span className="tag">{m.type}</span>
              <p>{m.content}</p>
            </div>
            <button type="button" className="danger" onClick={() => onDelete(m.id)}>
              Forget
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
