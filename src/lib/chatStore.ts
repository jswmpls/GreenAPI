import type { Chats, Message, NotificationBody } from '../types';

export function addMessage(
  chats: Chats,
  chatId: string,
  message: Message,
  opts: { title?: string; markUnread?: boolean } = {},
): Chats {
  const chat = chats[chatId] ?? { id: chatId, title: opts.title ?? chatId, messages: [], unread: 0 };
  if (chat.messages.some((m) => m.id === message.id)) return chats; // дубль уведомления
  return {
    ...chats,
    [chatId]: {
      ...chat,
      title: chat.title === chat.id && opts.title ? opts.title : chat.title,
      unread: opts.markUnread ? chat.unread + 1 : chat.unread,
      messages: [...chat.messages, message],
    },
  };
}

export function patchMessage(chats: Chats, chatId: string, id: string, patch: Partial<Message>): Chats {
  const chat = chats[chatId];
  if (!chat) return chats;
  return {
    ...chats,
    [chatId]: { ...chat, messages: chat.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)) },
  };
}

export function clearUnread(chats: Chats, chatId: string): Chats {
  const chat = chats[chatId];
  return chat && chat.unread ? { ...chats, [chatId]: { ...chat, unread: 0 } } : chats;
}

/** Достаёт текст из уведомления. Не-текстовые сообщения показываем заглушкой. */
export function extractText(body: NotificationBody): string {
  const data = body.messageData;
  if (!data) return '';
  if (data.typeMessage === 'textMessage') return data.textMessageData?.textMessage ?? '';
  if (data.typeMessage === 'extendedTextMessage') return data.extendedTextMessageData?.text ?? '';
  return '[вложение или сообщение не поддерживаемого типа]';
}
