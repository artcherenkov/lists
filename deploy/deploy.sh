#!/bin/bash
# Выкладка Watchlist v2 на cora: сборка коммита здесь, остальное – одним сеансом ssh (remote.sh).
# Использование: /bin/bash deploy/deploy.sh deploy [коммит] | rollback
# Работает на macOS /bin/bash 3.2: без ассоциативных массивов, mapfile и ${x,,}.
set -euo pipefail

HOST=lists
ROOT=/opt/lists
SITE=v2.watchlist.acherenkov.com
SSH=(ssh -o BatchMode=yes -o ConnectTimeout=15 -o ServerAliveInterval=15 -o ServerAliveCountMax=4)

cd "$(dirname "$0")/.."
tmp=""
in_remote=0

die() { echo "$*" >&2; exit 1; }

cleanup() {
  if [ -n "$tmp" ]; then
    git worktree remove --force "$tmp/wt" 2>/dev/null || :
    rm -rf "$tmp"
  fi
  git worktree prune
}
trap cleanup EXIT

log_hint() {
  echo "Серверная часть доделает начатое сама. Итог – в ssh $HOST tail $ROOT/deploy.log; перед повторным rollback" \
    "прочтите его: откат меняет указатели местами, и повтор вернул бы плохой релиз." >&2
}
interrupted() {
  if [ "$in_remote" = 1 ]; then log_hint; fi
  exit 130
}
trap interrupted INT TERM

# Серверная часть: режим, хеш (для отката «-»), 1 – если релиз идёт в stdin.
remote() {
  local script q="'" bs=\\ rc=0
  script=$(<deploy/remote.sh)
  in_remote=1
  # shellcheck disable=SC2029 # переменные подставляются здесь намеренно: на сервере их нет
  "${SSH[@]}" "$HOST" "bash -c '${script//$q/$q$bs$q$q}' _ '$ROOT' $1 $2 '$SITE' $3" || rc=$?
  in_remote=0
  if [ "$rc" = 255 ]; then log_hint; fi
  return "$rc"
}

build() { # коммит -> $tmp/rel.tgz: site/, Caddyfile, compose.yaml, SHA256SUMS
  tmp=$(mktemp -d)
  git worktree add -q --detach "$tmp/wt" "$1"
  (
    cd "$tmp/wt"
    unset APP_VERSION # номер версии должен называть коммит
    pnpm install --frozen-lockfile --prefer-offline
    pnpm --filter watchlist build
  )
  mkdir "$tmp/rel"
  cp -R "$tmp/wt/apps/watchlist/dist" "$tmp/rel/site"
  cp "$tmp/wt/deploy/Caddyfile" "$tmp/wt/deploy/compose.yaml" "$tmp/rel/"
  [ -f "$tmp/rel/site/index.html" ] || die "В сборке нет index.html"
  (cd "$tmp/rel" && find site -type f -print0 | LC_ALL=C sort -z | xargs -0 shasum -a 256 > SHA256SUMS)
  # bsdtar с macOS иначе кладёт в архив ._* и LIBARCHIVE.xattr.*
  COPYFILE_DISABLE=1 tar --no-xattrs -czf "$tmp/rel.tgz" -C "$tmp/rel" .
}

deploy() {
  local rev=$1 sha f rc=0
  sha=$(git rev-parse --verify --end-of-options "$rev^{commit}" 2>/dev/null) || die "Нет коммита $rev"
  [[ $sha =~ ^[0-9a-f]{40}$ ]] || die "Хеш коммита не из 40 шестнадцатеричных знаков: $sha"
  for f in Caddyfile compose.yaml; do
    git cat-file -e "$sha:deploy/$f" 2>/dev/null || die "В коммите $sha нет deploy/$f"
  done
  if [ -n "$(git status --porcelain --untracked-files=all)" ]; then
    echo "Внимание: незакоммиченное и неотслеживаемое в релиз не попадёт." >&2
  fi
  # Быстрый отказ до сборки: блокировку не держим, её берёт серверная часть. Код 0 – релиз уже на сервере,
  # 10 – релиза нет, нужна сборка, 75 – занято, остальные (сбой cd или открытия deploy.lock, 255 у ssh) – отказ.
  # shellcheck disable=SC2029 # переменные подставляются здесь намеренно: на сервере их нет
  "${SSH[@]}" "$HOST" "cd '$ROOT' && exec 9>>deploy.lock && { flock -n 9 || exit 75; } && { test -d releases/$sha || exit 10; }" || rc=$?
  case $rc in
    0) remote deploy "$sha" 0 < /dev/null ;;
    10) build "$sha"; remote deploy "$sha" 1 < "$tmp/rel.tgz" ;;
    75) echo "Другая выкладка или откат уже идут" >&2; exit 75 ;;
    *) die "ssh завершился с кодом $rc" ;;
  esac
}

case ${1:-} in
  deploy) deploy "${2:-HEAD}" ;;
  rollback) remote rollback - 0 < /dev/null ;;
  *) die "Использование: $0 deploy [коммит] | rollback" ;;
esac
