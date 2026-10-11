# Ingress – входной прокси сервера

Один контейнер Caddy на сервере принимает весь HTTPS-трафик и ведёт запросы к приложениям. Приложения не знают друг о друге и о прокси почти ничего: каждое объявляет метками контейнера «мой домен – мой порт» и подключается к сети `ingress`. Прокси читает метки через Docker, сам собирает конфигурацию и выпускает сертификаты Let's Encrypt. Это тот же принцип, что Ingress и ingress-контроллер в Kubernetes: приложение декларирует маршрут, контроллер исполняет.

Образ – [`lucaslorentz/caddy-docker-proxy`](https://github.com/lucaslorentz/caddy-docker-proxy), Caddy 2 с плагином обнаружения контейнеров.

Прокси обслуживает несколько приложений сервера `lists`, поэтому перед изменением `compose.yml` или `deploy.sh` прочитай этот файл целиком: здесь контракт с приложениями, порядок доставки и проверки. До 2026-10-11 проект жил в отдельном репозитории `ingress`.

## Контракт для приложения

Приложение в своём Compose делает три вещи и больше ни о чём не заботится:

```yaml
services:
  app:
    networks: [default, ingress]
    labels:
      caddy: ${DOMAIN}
      caddy.reverse_proxy: "{{upstreams 3000}}"
      caddy.encode: zstd gzip

networks:
  ingress:
    external: true
```

- Сеть `ingress` создаёт этот проект; для приложения она внешняя. Без подключения к ней прокси приложение не увидит.
- `caddy` – домен, `{{upstreams 3000}}` – адрес контейнера в сети `ingress` и порт, который слушает приложение внутри контейнера. Порты наружу приложение не публикует.
- Остальные метки `caddy.*` повторяют директивы Caddyfile: `caddy.encode`, `caddy.header`, `caddy.redir` и так далее. Полный список – в README образа.
- DNS домена должен указывать на сервер, режим без облачного проксирования (в Cloudflare – DNS only): сертификат выпускается по HTTP-запросу на 80 порт.

Больше ничего приложению знать не нужно: ни имён соседей, ни путей к конфигурации прокси, ни команд перезагрузки. Добавление и удаление приложения не требует правок в этом каталоге.

## Требования к серверу

Docker с Compose v2, свободные порты 80 и 443, SSH-доступ. Другие занимающие 80/443 контейнеры или службы нужно остановить до запуска.

Прокси читает `/var/run/docker.sock`: это доступ к Docker уровня администратора, принятый для сервера с одним владельцем. Сокет смонтирован только на чтение, что не ограничивает API, но защищает от случайной записи файла.

## Доставка и обновление

```sh
sh deploy/ingress/deploy.sh                          # на lists
INGRESS_HOST=другой-хост sh deploy/ingress/deploy.sh # на другой сервер из ~/.ssh/config
```

Скрипт копирует `compose.yml` в `/opt/ingress` на сервере и выполняет `docker compose up -d --wait`. Обновление версии образа – правка тега в `compose.yml` и тот же скрипт. Секретов и `.env` у проекта нет.

Сертификаты и состояние Caddy живут в томах `ingress_caddy_data` и `ingress_caddy_config`. При переносе на другой сервер тома можно не переносить: сертификаты выпустятся заново за минуту. Лимит Let's Encrypt – 5 одинаковых сертификатов в неделю.

## Проверка

```sh
ssh lists 'cd /opt/ingress && docker compose ps && docker compose logs --tail=30 caddy'
curl -sS -o /dev/null -w '%{http_code}\n' https://watchlist.acherenkov.com/healthz
curl -sS -o /dev/null -w '%{http_code}\n' https://v2.watchlist.acherenkov.com/
```

В логе прокси после старта видны строки о найденных контейнерах и сгенерированной конфигурации. Если приложение не открывается: проверь, что его контейнер подключён к сети `ingress` (`docker inspect имя --format '{{json .NetworkSettings.Networks}}'`), что метка `caddy` содержит нужный домен, и что DNS домена ведёт на этот сервер.

## Приложения на lists

| Домен                         | Проект       | Где объявлен маршрут                          |
| ----------------------------- | ------------ | --------------------------------------------- |
| `watchlist.acherenkov.com`    | Watchlist    | `deploy/compose.yaml` репозитория `watchlist` |
| `readlist.acherenkov.com`     | Readlist     | `deploy/compose.yaml` репозитория `readlist`  |
| `v2.watchlist.acherenkov.com` | Watchlist v2 | `deploy/compose.yaml` этого репозитория       |

ABC Cloud (`cloud.acherenkov.com`) уехал с сервера 2026-10-11.

## Другие серверы

| Сервер | Домен | Проект | Где объявлен маршрут |
| --- | --- | --- | --- |
| `abc-cloud-staging` | `staging.cloud.acherenkov.com` | тестовый стенд ABC Cloud, письма Mailpit на `/mail/` | `deploy/compose.yml` и `deploy/compose.staging.yml` репозитория `abc/cloud` |

Таблица – для ориентации человека; прокси её не читает.
