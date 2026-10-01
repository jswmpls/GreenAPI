import { useEffect, useRef } from 'react';
import { deleteNotification, receiveNotification } from './api';
import type { Credentials, NotificationBody } from '../types';

const RETRY_DELAY_MS = 3000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useNotifications(
  creds: Credentials | null,
  onNotification: (body: NotificationBody) => void,
  onError: (error: unknown) => void,
) {
  const handlers = useRef({ onNotification, onError });
  useEffect(() => {
    handlers.current = { onNotification, onError };
  });

  useEffect(() => {
    if (!creds) return;
    const ctrl = new AbortController();

    (async () => {
      while (!ctrl.signal.aborted) {
        try {
          const n = await receiveNotification(creds, ctrl.signal);
          if (!n) continue; 
          handlers.current.onNotification(n.body);
          await deleteNotification(creds, n.receiptId, ctrl.signal);
        } catch (e) {
          if (ctrl.signal.aborted) return;
          handlers.current.onError(e);
          await sleep(RETRY_DELAY_MS);
        }
      }
    })();

    return () => ctrl.abort();
  }, [creds]);
}
