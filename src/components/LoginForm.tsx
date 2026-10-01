import { useState, type FormEvent } from "react";
import { getStateInstance } from "../lib/api";
import type { Credentials } from "../types";

interface Props {
  onLogin: (creds: Credentials) => void;
}

export function LoginForm({ onLogin }: Props) {
  const [apiUrl, setApiUrl] = useState("");
  const [idInstance, setIdInstance] = useState("");
  const [apiTokenInstance, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const creds = {
      apiUrl: apiUrl.trim(),
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
    };
    if (!/^\d+$/.test(creds.idInstance))
      return setError("idInstance должен состоять из цифр");

    setLoading(true);
    setError("");
    try {
      const state = await getStateInstance(creds);
      if (state !== "authorized") {
        setError(
          `Инстанс не авторизован (состояние: ${state}). Авторизуйте его в личном кабинете GREEN-API.`,
        );
        return;
      }
      onLogin(creds);
    } catch {
      setError(
        "Не удалось войти. Проверьте idInstance, apiTokenInstance и apiUrl.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={submit}>
        <h1>Вход в чат</h1>
        <p className="muted">
          Данные инстанса Telegram из личного кабинета GREEN-API
        </p>

        <label>
          idInstance
          <input
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            inputMode="numeric"
            required
          />
        </label>
        <label>
          apiTokenInstance
          <input
            type="password"
            value={apiTokenInstance}
            onChange={(e) => setToken(e.target.value)}
            required
          />
        </label>
        <label>
          apiUrl
          <input
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            required
          />
        </label>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="btn" disabled={loading}>
          {loading ? "Проверяем…" : "Войти"}
        </button>
      </form>
    </div>
  );
}
