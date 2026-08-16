import type { ChatMessage } from '../types';
import { useEffect, useRef } from 'react';

export function Conversation({ messages }: { messages: ChatMessage[] }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="conversation" aria-live="polite">
      {messages.length === 0 && (
        <div className="conversation__empty">
          <p>Awaiting input.</p>
          <p className="muted">Try “Remember that I prefer oat milk” or “Build me a coffee website.”</p>
        </div>
      )}
      {messages.map((m) => (
        <article key={m.id} className={`bubble bubble--${m.role}`}>
          <header>{m.role === 'user' ? 'You' : 'JARVIS'}</header>
          <p>{m.content}</p>
        </article>
      ))}
      <div ref={endRef} />
    </div>
  );
}
