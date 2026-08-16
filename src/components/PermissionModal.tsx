import type { PermissionDecision, PermissionRequest } from '../types';

export function PermissionModal({
  request,
  onDecide,
}: {
  request: PermissionRequest;
  onDecide: (d: PermissionDecision) => void;
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <p className="modal__eyebrow">{request.level.replace('_', ' ')} permission</p>
        <h2>{request.summary}</h2>
        <p className="muted">Tool: {request.tool}</p>
        <pre>{request.details}</pre>
        <div className="modal__actions">
          <button type="button" className="danger" onClick={() => onDecide('deny')}>
            Deny
          </button>
          <button type="button" className="ghost" onClick={() => onDecide('allow_session')}>
            Allow for session
          </button>
          <button type="button" className="send" onClick={() => onDecide('allow')}>
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
