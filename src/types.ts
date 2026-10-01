export interface Credentials {
  apiUrl: string;
  idInstance: string;
  apiTokenInstance: string;
}

export interface Message {
  id: string;
  text: string;
  outgoing: boolean;
  timestamp: number; // unix seconds
  status?: 'sending' | 'sent' | 'error';
}

export interface Chat {
  id: string; // chatId из GREEN-API
  title: string;
  messages: Message[];
  unread: number;
}

export type Chats = Record<string, Chat>;

/** Часть формата входящих уведомлений, которая нам нужна. */
export interface NotificationBody {
  typeWebhook: string;
  idMessage?: string;
  timestamp?: number;
  senderData?: {
    chatId: string;
    chatName?: string;
    senderName?: string;
  };
  messageData?: {
    typeMessage: string;
    textMessageData?: { textMessage: string };
    extendedTextMessageData?: { text: string };
  };
}

export interface ReceivedNotification {
  receiptId: number;
  body: NotificationBody;
}
