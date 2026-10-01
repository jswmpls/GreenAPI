import { useState, type FormEvent } from 'react';
import type { Chat } from '../types';

interface Props {
  chats: Chat[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: (phone: string) => Promise<void>;
  onLogout: () => void;
}

export function Sidebar({ chats, activeId, onSelect, onCreate, onLogout }: Props) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) return setError('Введите номер в международном формате');
    setLoading(true);
    setError('');
    try {
      await onCreate(digits);
      setPhone('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать чат');
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="sidebar">
      <form className="newchat" onSubmit={submit}>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Номер: 79876543210"
          inputMode="tel"
          aria-label="Номер телефона получателя"
        />
        <button className="btn" disabled={loading} title="Создать чат">{loading ? '…' : '+'}</button>
      </form>
      {error && <p className="error sidebar__error">{error}</p>}

      <ul className="chatlist">
        {chats.length === 0 && <li className="muted chatlist__empty">Чатов пока нет. Введите номер получателя.</li>}
        {chats.map((chat) => {
          const last = chat.messages[chat.messages.length - 1];
          return (
            <li key={chat.id}>
              <button
                className={`chatitem${chat.id === activeId ? ' chatitem--active' : ''}`}
                onClick={() => onSelect(chat.id)}
              >
                <span className="avatar">{chat.title.slice(0, 1).toUpperCase()}</span>
                <span className="chatitem__body">
                  <span className="chatitem__title">{chat.title}</span>
                  <span className="chatitem__last muted">{last?.text ?? 'Нет сообщений'}</span>
                </span>
                {chat.unread > 0 && <span className="badge">{chat.unread}</span>}
              </button>
            </li>
          );
        })}
      </ul>

      <button className="linkbtn" onClick={onLogout}>Выйти</button>
    </aside>
  );
}
