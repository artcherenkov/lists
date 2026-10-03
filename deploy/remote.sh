#!/usr/bin/env bash
# Серверная часть выкладки и отката на cora (bash 5.2). deploy.sh передаёт её текстом в `ssh … bash -c`,
# архив релиза приходит в stdin. Аргументы: корень, режим (deploy | rollback), хеш коммита, сайт,
# 1 – если релиз надо принять из stdin.
set -euo pipefail
root=$1 mode=$2 sha=$3 site=$4 upload=$5
why=""

die() { echo "$*" >&2; exit 1; }
point() { ln -sfn "$2" "$1.new" && mv -T "$1.new" "$1"; }
compose=(docker compose -f current/compose.yaml)

set_pointers() { # на что указывают current и previous (пусто – previous нет)
  printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "${1#releases/}" >> releases.log &&
    { if [ -n "$2" ]; then point previous "$2"; else rm -f previous; fi; } &&
    point current "$1"
}

bring_up() {
  "${compose[@]}" up -d --wait --wait-timeout 120 &&
    "${compose[@]}" exec -T caddy caddy reload --config /srv/current/Caddyfile --adapter caddyfile
}

check_site() { # одна проба; 0 – всё верно, иначе первая нарушенная защита в $why
  local p a
  req() { local path=$1; shift; curl -sS --max-time 15 --resolve "$site:443:127.0.0.1" -D tmp/h -o tmp/b -w '%{http_code}' "$@" "https://$site/$path"; }
  expect() { local msg=$1; shift; "$@" || { why=$msg; return 1; }; }
  for p in "" index.html sw.js; do # «/» и «/index.html» – оба адреса лежат в предкеше Workbox
    expect "/$p: ответ не 200" [ "$(req "$p")" = 200 ] || return 1
    expect "/$p: содержимое не совпало с релизом" cmp -s tmp/b "current/site/${p:-index.html}" || return 1
    expect "/$p: нет Cache-Control: no-cache" grep -qi '^cache-control: no-cache' tmp/h || return 1
    expect "/$p: есть ETag или Last-Modified" [ -z "$(grep -iE '^(etag|last-modified):' tmp/h)" ] || return 1
    expect "/$p: нет X-Robots-Tag: noindex" grep -qi '^x-robots-tag: noindex' tmp/h || return 1
  done
  # Ложный 304 для sw.js: без срезки запросных валидаторов Caddy отвечает на них 304
  expect "sw.js с If-None-Match: * не 200" [ "$(req sw.js -H 'If-None-Match: *')" = 200 ] || return 1
  expect "sw.js с If-Modified-Since не 200" [ "$(req sw.js -H 'If-Modified-Since: Fri, 01 Jan 2100 00:00:00 GMT')" = 200 ] || return 1
  set -- current/site/assets/*
  a=${1##*/}
  expect "assets/$a: нет 200 или immutable" [ "$(req "assets/$a")" = 200 ] || return 1
  expect "assets/$a: нет Cache-Control: immutable" grep -qi '^cache-control:.*immutable' tmp/h || return 1
  expect "/api/x не 404" [ "$(req api/x)" = 404 ] || return 1
}

verify_site() { # повторяет пробу до срока: Caddy может перезапускаться, а при первой выкладке выпускать сертификат
  local limit=60
  [ -n "$cur" ] || limit=300
  local end=$((SECONDS + limit)) # срок по времени, не по числу проходов: проход идёт до 7 запросов по 15 с
  until check_site; do
    [ "$SECONDS" -lt "$end" ] || return 1
    sleep 2
  done
}

# Возврат не ловушкой ERR: в условии (`if activate`) `set -e` не действует, поэтому каждый шаг проверяется явно,
# а ERR в bash 3.2 срабатывает на сбой `curl` внутри `$(…)` и откатила бы исправную выкладку (в 5.2 – нет).
activate() { # переключает на $target, поднимает сервисы и проверяет сайт; причина неудачи – в $why
  if [ "$cur" != "releases/$target" ]; then
    set_pointers "releases/$target" "$cur" || { why="не удалось переставить указатели"; return 1; }
  fi
  bring_up || { why="compose up или reload не удались"; return 1; }
  verify_site
}

restore() { # указатели – ровно как были до выкладки; сервисы – прежнего релиза
  set_pointers "$cur" "$prev" || { echo "Возврат не удался: указатели могут остаться частично переставленными." >&2; return 1; }
  bring_up || { echo "Указатели возвращены, а сервисы прежнего релиза не поднялись." >&2; return 1; }
}

cd "$root"
exec 9>>deploy.lock # дописывание, а не усечение; так же открывает файл прежняя TypeScript-команда
flock -n 9 || { echo "Другая выкладка или откат уже идут" >&2; exit 75; }
trap '' HUP
# Вывод идёт через tee в журнал: после обрыва ssh `docker` и `caddy` на закрытом stdout получили бы SIGPIPE
# и дали бы ложный сбой, а скрипт довёл бы дело до возврата исправной выкладки.
exec > >(trap '' PIPE; exec tee -ap deploy.log) 2>&1
rm -rf tmp
mkdir -p tmp releases
cur=$(readlink current || :) prev=$(readlink previous || :)

if [ "$mode" = rollback ]; then
  [ -n "$prev" ] && [ "$prev" != "$cur" ] && [ -d "$prev" ] ||
    die "Откатываться некуда: previous='$prev', current='$cur', последняя строка журнала: $(tail -n1 releases.log)"
  target=${prev#releases/}
else
  target=$sha
  if [ ! -d "releases/$sha" ]; then
    [ "$upload" = 1 ] || die "Релиз пропал с сервера, повторите команду"
    mkdir tmp/r
    timeout 300 tar -xzf - --no-same-owner -C tmp/r
    chmod -R u=rwX,go=rX tmp/r
    (cd tmp/r && sha256sum -c --quiet --strict SHA256SUMS)
    mv tmp/r "releases/$sha"
  fi
fi
exec </dev/null # дальше stdin ни к чему, а `docker compose exec` мог бы читать архив

# Образ из compose.yaml релиза; сервис уже монтирует /opt/lists как /srv, отдельный том не нужен
docker compose -f "releases/$target/compose.yaml" run --rm --no-deps -T caddy caddy validate --config "/srv/releases/$target/Caddyfile" --adapter caddyfile

if activate; then
  echo "готово: $(readlink current)"
  exit 0
fi
echo "Сбой: $why" >&2
inspect="Осмотр: cd $root && readlink current previous && tail -n3 releases.log && docker compose -f current/compose.yaml ps"
if [ "$cur" = "releases/$target" ]; then
  die "Релиз уже был текущим, возвращать нечего. Исправьте причину и повторите команду."
elif [ -z "$cur" ]; then
  die "Первая выкладка, возвращаться некуда. $inspect"
fi
echo "Возвращаю прежний релиз ${cur#releases/}" >&2
restore || die "$inspect"
die "Выкладка не удалась, прежний релиз снова текущий."
