import type { Credentials, ReceivedNotification } from '../types';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const instanceUrl = (c: Credentials, method: string) =>
  `${c.apiUrl.replace(/\/+$/, '')}/waInstance${c.idInstance}/${method}/${c.apiTokenInstance}`;

async function request<T>(url: string, init?: RequestInit): Promise<T | null> {
  const res = await fetch(url, init);
  const text = await res.text();
  if (!res.ok) throw new ApiError(res.status, text || res.statusText);
  return text ? (JSON.parse(text) as T) : null;
}

const post = <T>(c: Credentials, method: string, body: unknown) =>
  request<T>(instanceUrl(c, method), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

export async function getStateInstance(c: Credentials): Promise<string> {
  const data = await request<{ stateInstance: string }>(instanceUrl(c, 'getStateInstance'));
  return data?.stateInstance ?? 'unknown';
}

export async function checkAccount(c: Credentials, phoneNumber: string): Promise<string | null> {
  const data = await post<{ exist?: boolean; chatId?: string }>(c, 'checkAccount', {
    phoneNumber: Number(phoneNumber),
  });
  return data?.exist && data.chatId ? data.chatId : null;
}

export async function sendMessage(c: Credentials, chatId: string, message: string): Promise<string> {
  const data = await post<{ idMessage: string }>(c, 'sendMessage', { chatId, message });
  if (!data?.idMessage) throw new ApiError(500, 'Пустой ответ sendMessage');
  return data.idMessage;
}

export async function receiveNotification(
  c: Credentials,
  signal: AbortSignal,
): Promise<ReceivedNotification | null> {
  return request<ReceivedNotification>(`${instanceUrl(c, 'receiveNotification')}?receiveTimeout=5`, { signal });
}

export async function deleteNotification(c: Credentials, receiptId: number, signal: AbortSignal) {
  await request(`${instanceUrl(c, 'deleteNotification')}/${receiptId}`, { method: 'DELETE', signal });
}
