# Lists

Новые версии Watchlist и Readlist в одном монорепозитории. Решения, порядок работы и открытые вопросы – в [docs/plan.md](docs/plan.md): прочитай перед работой и сверь с кодом. Работа идёт вехами – раздел «Вехи» плана. Веху запускает автор: без слова автора следующую не начинай.

## Порядок работы

Работа идёт по общим навыкам `research-work` и `develop-work` и агентам `implementer`, `reviewer` и `researcher` из `~/.claude`. Крупная часть работы здесь – веха. Местные соглашения для них:

- Основная ветка – `master`.
- Документ задачи – документ вехи `docs/milestones/NN-slug.md`, например `05-data-platform.md`.
- Журнал решений – раздел «Решения» плана. При закрытии вехи обновляется и раздел «Состояние работы» плана.
- Worktree задачи – `.claude/worktrees/<имя>` от `master`. Зависимости в новом worktree – `pnpm install --frozen-lockfile --prefer-offline`.
- Полная проверка перед слиянием – `TURBO_FORCE=true pnpm check`: без `TURBO_FORCE` кэш Turbo подменит прогон.
- Схема данных, синхронизация, вход и перенос данных проходят ревью решения до кода: ошибка в них теряет данные или открывает чужие.
- Способ показа изменений вида – [docs/ui.md](docs/ui.md#изменения-вида).

Коммиты – по общим правилам, ключа задачи нет. Push – только по поручению автора.

## Качество кода

Местные правила кода – в [CODESTYLE.md](CODESTYLE.md), общие – в навыке `implement-change`: прочитай их перед работой с кодом.

## Окружение

- Node.js 24.16.0, pnpm 12.3.4 (версия – в `packageManager` корневого `package.json`), TypeScript 7 с нативным `tsc` – как в `../abc/cloud`. Настройки pnpm – в `pnpm-workspace.yaml`: `.npmrc` – защищённый файл, его запись auto mode сам не одобрит.
- Docker – colima: 2 CPU и 2 ГБ, контейнеры `pm-trial` уже занимают около 850 МБ. Стек разработки – compose-проект `lists`, порты только на `127.0.0.1`; на Mac заняты 3100, 3200, 5000, 7000, 9222, 30000, 30001 и 63342, а 5175 и 6006 – Vite и Storybook автора. Контейнеры `pm-trial` хранят данные автора: не трогай их, а Docker вызывай только через `docker compose` проекта `lists`. Если стеку не хватит памяти, спроси автора: colima сам не перезапускай.
- В разработке бот работает через консоль, а Mailpit появится вместе со входом по почте. Не используй рабочий Telegram-токен локально: второй процесс бота заберёт обновления у сервера.
- Секреты – только в `.env`: читать и менять его агентам запрещено правилом. Стек разработки работает без него, ключи автор кладёт сам. Ключ TMDB есть у автора, а `api.themoviedb.org` с Mac может не открываться без VPN.
- Браузеры Playwright уже скачаны в `~/Library/Caches/ms-playwright`.
- Текущие приложения – образец для паритета, читать их можно, менять нельзя: `../watchlist` (ветка `feat/series-updates` в worktree `../watchlist/.claude/worktrees/series-updates`, на сервере – образ `1dbb533`) и `../readlist` (`master`).

## Команды

- `pnpm install` – зависимости. Новые ставит только `pnpm add` (`-w` для корня, `--filter <пакет>` для пакета): `package.json` и `pnpm-lock.yaml` руками не правим. Политику минимального возраста релиза pnpm не ослабляем: если свежая версия пакета требует исключения в `pnpm-workspace.yaml`, берём последнюю созревшую.
- `pnpm dev` – Watchlist на `http://localhost:5175`.
- `pnpm storybook` – Storybook на `http://localhost:6006`.
- `pnpm check` – все проверки (перед слиянием – с `TURBO_FORCE=true`, см. «Порядок работы»): `fmt:check`, `lint`, `check-types`, сборка Storybook, unit и e2e. Перед push хук `.husky/pre-push` гоняет быстрые: `fmt:check`, `lint`, `check-types` и unit – без сборки Storybook и e2e.
- `pnpm test:unit` – Vitest. `pnpm test:e2e` – сборка приложения и Playwright на ней. Перед написанием тестов прочитай [docs/testing.md](docs/testing.md).
- `pnpm deploy:v2 [коммит]` – выкладка коммита (по умолчанию `HEAD`) на `https://v2.watchlist.acherenkov.com`; на `cora` выкладываем только ею. `bash deploy/setup-server.sh` – первичная настройка `cora`. Устройство сервера, блокировка и прерывание – в [deploy/README.md](deploy/README.md).
- `pnpm fmt` – форматирование oxfmt. Из него исключены сгенерированное (`packages/ui/src/components/ui/**`, `pnpm-lock.yaml`) и файлы, которые ведёт оркестратор вручную: `docs/plan.md`, `docs/milestones/**`, `.claude/**`.
- Компоненты shadcn, пресет и Storybook – в [docs/ui.md](docs/ui.md): прочитай перед работой с интерфейсом.
- Markdown пишем без переносов внутри абзаца: абзац и пункт списка – одна строка, переносит окно. В форматируемых файлах oxfmt разворачивает переносы сам (`proseWrap: never`), в исключённых – следи за этим сам.

## Серверы

- `cora` (`ssh cora-selectel` или `ssh lists`) – сервер списков, подробности – в плане, раздел «Сервер». Действия на нём – только по поручению автора. Том `caddy_data` с сертификатами не удаляй (`docker compose down -v`, `docker volume rm`): Let's Encrypt выдаёт не больше 5 одинаковых сертификатов в неделю.
- `viola-selectel` и `hope-vdsina` – рабочие серверы текущих приложений и прокси. К ним не подключайся.
