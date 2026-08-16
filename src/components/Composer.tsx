import { FormEvent, useEffect, useRef, useState } from 'react';

type Props = {
  disabled?: boolean;
  wakePhrases: string[];
  onSend: (text: string) => void;
  onVoice: (text: string) => void;
};

type Recog = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

export function Composer({ disabled, onSend, onVoice, wakePhrases }: Props) {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<Recog | null>(null);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => Recog;
      webkitSpeechRecognition?: new () => Recog;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      if (transcript) onVoice(transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
  }, [onVoice]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  }

  function toggleListen() {
    const recognition = recognitionRef.current;
    if (!recognition) {
      onSend(
        `Voice input unavailable in this browser. Configured wake phrases: ${wakePhrases.join(', ')}`,
      );
      return;
    }
    if (listening) {
      recognition.stop();
      setListening(false);
      return;
    }
    setListening(true);
    recognition.start();
  }

  return (
    <form className="composer" onSubmit={submit}>
      <button
        type="button"
        className={`ptt ${listening ? 'ptt--hot' : ''}`}
        onClick={toggleListen}
        title="Push to talk"
        disabled={disabled}
      >
        {listening ? 'Listening…' : 'PTT'}
      </button>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Address JARVIS…"
        disabled={disabled}
        aria-label="Message"
      />
      <button type="submit" className="send" disabled={disabled || !text.trim()}>
        Send
      </button>
    </form>
  );
}
