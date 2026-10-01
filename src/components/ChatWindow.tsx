import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { Chat } from '../types';

interface Props {
  chat: Chat;
  onSend: (text: string) => void;
  onBack: () => void;
}

const time = (ts: number) => new Date(ts * 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

export function ChatWindow({ chat, onSend, onBack }: Props) {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [chat.messages.length, chat.id]);

  function send() {
    const value = text.trim();
    if (!value) return;
    onSend(value);
    setText('');
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <section className="chat">
      <header className="chat__header">
        <button className="linkbtn chat__back" onClick={onBack} aria-label="К списку чатов">←</button>
        <span className="avatar">{chat.title.slice(0, 1).toUpperCase()}</span>
        <strong>{chat.title}</strong>
      </header>

      <div className="messages">
        {chat.messages.map((m) => (
          <div key={m.id} className={`bubble ${m.outgoing ? 'bubble--out' : 'bubble--in'}`}>
            <span className="bubble__text">{m.text}</span>
            <span className="bubble__meta">
              {m.status === 'sending' && 'отправка… '}
              {m.status === 'error' && 'ошибка · '}
              {time(m.timestamp)}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <footer className="composer">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Сообщение"
          rows={1}
          aria-label="Текст сообщения"
        />
        <button className="btn" onClick={send} disabled={!text.trim()}>Отправить</button>
      </footer>
    </section>
  );
}
