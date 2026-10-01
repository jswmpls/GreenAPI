import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { LoginForm } from './components/LoginForm';
import { Sidebar } from './components/Sidebar';
import { ApiError, checkAccount, sendMessage } from './lib/api';
import { addMessage, clearUnread, extractText, patchMessage } from './lib/chatStore';
import { useNotifications } from './lib/useNotifications';
import type { Chats, Credentials, NotificationBody } from './types';

const CREDS_KEY = 'greenapi:creds';
const chatsKey = (id: string) => `greenapi:chats:${id}`;

function load<T>(storage: Storage, key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function App() {
  // Токен хранится только в sessionStorage — исчезает при закрытии вкладки.
  const [creds, setCreds] = useState<Credentials | null>(() => load(sessionStorage, CREDS_KEY, null));
  const [chats, setChats] = useState<Chats>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [banner, setBanner] = useState('');
  const activeRef = useRef<string | null>(null);
  activeRef.current = activeId;

  // История чатов (локально, на инстанс)
  useEffect(() => {
    if (creds) setChats(load(localStorage, chatsKey(creds.idInstance), {}));
  }, [creds]);
  useEffect(() => {
    if (creds) localStorage.setItem(chatsKey(creds.idInstance), JSON.stringify(chats));
  }, [creds, chats]);

  const handleNotification = useCallback((body: NotificationBody) => {
    setBanner('');
    const isIncoming = body.typeWebhook === 'incomingMessageReceived';
    // Сообщения, отправленные из этого интерфейса (outgoingAPIMessageReceived), уже добавлены локально.
    const isFromPhone = body.typeWebhook === 'outgoingMessageReceived';
    if ((!isIncoming && !isFromPhone) || !body.senderData || !body.idMessage) return;

    const { chatId, chatName, senderName } = body.senderData;
    setChats((prev) =>
      addMessage(
        prev,
        chatId,
        {
          id: body.idMessage!,
          text: extractText(body),
          outgoing: isFromPhone,
          timestamp: body.timestamp ?? Math.floor(Date.now() / 1000),
        },
        { title: chatName || senderName, markUnread: isIncoming && activeRef.current !== chatId },
      ),
    );
  }, []);

  const handleError = useCallback((e: unknown) => {
    setBanner(
      e instanceof ApiError
        ? `Ошибка получения сообщений (${e.status}). Повторяем…`
        : 'Нет связи с GREEN-API. Повторяем…',
    );
  }, []);

  useNotifications(creds, handleNotification, handleError);

  function login(c: Credentials) {
    sessionStorage.setItem(CREDS_KEY, JSON.stringify(c));
    setCreds(c);
  }

  function logout() {
    sessionStorage.removeItem(CREDS_KEY);
    setCreds(null);
    setChats({});
    setActiveId(null);
  }

  async function createChat(phone: string) {
    if (!creds) return;
    let chatId: string | null;
    try {
      chatId = await checkAccount(creds, phone);
    } catch (e) {
      throw new Error(e instanceof ApiError ? `Ошибка проверки номера (${e.status})` : 'Нет связи с GREEN-API');
    }
    if (!chatId) throw new Error('Для этого номера не найден аккаунт Telegram');
    setChats((prev) => (prev[chatId!] ? prev : { ...prev, [chatId!]: { id: chatId!, title: `+${phone}`, messages: [], unread: 0 } }));
    selectChat(chatId);
  }

  function selectChat(id: string) {
    setActiveId(id);
    setChats((prev) => clearUnread(prev, id));
  }

  async function send(text: string) {
    if (!creds || !activeId) return;
    const chatId = activeId;
    const tempId = `tmp-${Date.now()}`;
    const timestamp = Math.floor(Date.now() / 1000);
    setChats((prev) => addMessage(prev, chatId, { id: tempId, text, outgoing: true, timestamp, status: 'sending' }));
    try {
      const idMessage = await sendMessage(creds, chatId, text);
      setChats((prev) => patchMessage(prev, chatId, tempId, { id: idMessage, status: 'sent' }));
    } catch (e) {
      setChats((prev) => patchMessage(prev, chatId, tempId, { status: 'error' }));
      setBanner(e instanceof ApiError ? `Не удалось отправить сообщение (${e.status})` : 'Нет связи с GREEN-API');
    }
  }

  const chatList = useMemo(
    () =>
      Object.values(chats).sort(
        (a, b) => (b.messages.at(-1)?.timestamp ?? 0) - (a.messages.at(-1)?.timestamp ?? 0),
      ),
    [chats],
  );

  if (!creds) return <LoginForm onLogin={login} />;

  const activeChat = activeId ? chats[activeId] : undefined;

  return (
    <div className={`app${activeChat ? ' app--chat-open' : ''}`}>
      {banner && <div className="banner" role="status">{banner}</div>}
      <Sidebar chats={chatList} activeId={activeId} onSelect={selectChat} onCreate={createChat} onLogout={logout} />
      {activeChat ? (
        <ChatWindow chat={activeChat} onSend={send} onBack={() => setActiveId(null)} />
      ) : (
        <section className="chat chat--empty muted">Выберите чат или создайте новый по номеру телефона</section>
      )}
    </div>
  );
}
