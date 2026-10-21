/**
 * Клиент Bot API Telegram на встроенном `fetch` (решение 11 вехи 6): только методы, которые нужны
 * боту. Прокси до Telegram задаёт окружение (`NODE_USE_ENV_PROXY=1` и `HTTPS_PROXY`), а не код.
 */
export interface BotApi {
  /** Долгий опрос: ждёт новых сообщений до `timeoutSeconds` и отдаёт их с номера `offset`. */
  getUpdates(params: {
    offset: number;
    timeoutSeconds: number;
    signal: AbortSignal;
  }): Promise<Update[]>;
  /**
   * Текст с разметкой HTML Telegram: `<code>` в нём копируется нажатием целиком. Срок задаёт
   * `signal`: без него запрос через зависший прокси ждёт ответа минутами.
   */
  sendMessage(chatId: number | string, html: string, signal?: AbortSignal): Promise<void>;
}

/** Обновление Bot API – только поля, которые читает бот. */
export interface Update {
  update_id: number;
  message?: Message;
}

export interface Message {
  message_id: number;
  /** Время отправки, секунды Unix. */
  date: number;
  text?: string;
  chat: { id: number; type: string };
  from?: { id: number; first_name: string; last_name?: string; username?: string };
}

interface Reply<T> {
  ok: boolean;
  result?: T;
  description?: string;
}

export function createBotApi({ apiUrl, token }: { apiUrl: string; token: string }): BotApi {
  async function call<T>(method: string, params: object, signal?: AbortSignal): Promise<T> {
    const response = await fetch(`${apiUrl}/bot${token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(params),
      signal,
    });
    const reply = (await response.json()) as Reply<T>;
    // В ошибке – только метод и ответ Telegram: текст сообщения с кодом и токен в журнал не идут.
    if (!reply.ok || reply.result === undefined) {
      throw new Error(`Bot API ${method}: ${response.status} ${reply.description ?? ""}`.trim());
    }
    return reply.result;
  }

  return {
    getUpdates: ({ offset, timeoutSeconds, signal }) =>
      // Только `message`: у `business_message` и других чат может быть чужой перепиской.
      call<Update[]>(
        "getUpdates",
        { offset, timeout: timeoutSeconds, allowed_updates: ["message"] },
        signal,
      ),
    sendMessage: async (chatId, html, signal) => {
      await call(
        "sendMessage",
        {
          chat_id: chatId,
          text: html,
          parse_mode: "HTML",
          link_preview_options: { is_disabled: true },
        },
        signal,
      );
    },
  };
}
