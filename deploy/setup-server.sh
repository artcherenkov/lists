#!/usr/bin/env bash
# Настраивает сервер списков (cora) по ssh: Docker, SSH только по ключу, ufw, каталог /opt/lists.
# Запуск с ноутбука: bash deploy/setup-server.sh [ssh-хост, по умолчанию lists].
# Повторный запуск ничего не меняет, если сервер уже настроен. Устройство и порядок – в deploy/README.md.
set -euo pipefail

HOST=lists
for arg in "$@"; do
  case "$arg" in
    -*) printf 'Неизвестный флаг: %s\n' "$arg" >&2; exit 2 ;;
    *) HOST=$arg ;;
  esac
done

SSH_CONF=/etc/ssh/sshd_config.d/10-lists.conf
SSHD_CONF_CONTENT=$'PasswordAuthentication no\nPermitRootLogin prohibit-password'
UFW_RULES=(22/tcp 80/tcp 443/tcp 443/udp)
APP_DIR=/opt/lists
PACKAGES="docker.io docker-compose-v2 ufw"
STATE_DIR=/run/lists-setup
TIMER=lists-setup-rollback
CONFIRM_SECONDS=300
REHEARSAL_SECONDS=10
EGRESS_IMAGE=alpine:3
EGRESS_URL=https://acme-v02.api.letsencrypt.org/directory

# Сервер переводит вывод ufw на язык клиента, а разбираем мы английские слова.
# Перекрыть LC_ALL через ssh нельзя: сервер ставит свой LC_ALL из /etc/default/locale, поэтому префикс у самой команды.
UFW="LC_ALL=C LANGUAGE=C ufw"

BASE_OPTS=(-o BatchMode=yes -o ConnectTimeout=10 -o ServerAliveInterval=5 -o ServerAliveCountMax=3)
CONTROL_DIR=$(mktemp -d /tmp/lists-setup.XXXXXX)
CONTROL=$CONTROL_DIR/ssh
CURRENT_STEP=
ROLLBACK_ARMED=0

step() {
  CURRENT_STEP=$*
  printf '\n==> %s\n' "$CURRENT_STEP"
}

note() {
  printf '    %s\n' "$*"
}

fail() {
  printf 'ОШИБКА: %s\n' "$*" >&2
  exit 1
}

# Команды через первое соединение, которое остаётся открытым всю настройку.
remote() {
  ssh -n "${BASE_OPTS[@]}" -o ControlMaster=no -o ControlPath="$CONTROL" "$HOST" "$@"
}

remote_stdin() {
  ssh "${BASE_OPTS[@]}" -o ControlMaster=no -o ControlPath="$CONTROL" "$HOST" "$@"
}

remote_script() {
  remote_stdin bash -se -- "$@"
}

# Отдельное соединение без общего канала: так видно, пустит ли сервер нового клиента.
fresh_ssh() {
  ssh -n "${BASE_OPTS[@]}" -o ControlMaster=no -o ControlPath=none "$@"
}

# Какие способы входа предлагает сервер клиенту без ключа, например "publickey,password".
offered_auth_methods() {
  local out
  out=$(fresh_ssh -o PubkeyAuthentication=no -o PreferredAuthentications=password,keyboard-interactive "$HOST" true 2>&1 || true)
  sed -n 's/.*Permission denied (\(.*\))\..*/\1/p' <<<"$out"
}

# /run смонтирован с noexec, поэтому скрипт отката всегда запускается через sh, а не напрямую.
rollback_now() {
  local code=0
  printf 'Доступ не подтверждён: возвращаю прежние sshd и ufw.\n' >&2
  remote sh "$STATE_DIR/rollback.sh" || code=$?
  if [ "$code" = 0 ]; then
    if remote systemctl stop "$TIMER.timer"; then
      printf 'Прежние настройки возвращены, таймер снят.\n' >&2
    else
      printf 'Прежние настройки возвращены, но таймер снять не удалось: systemctl stop %s.timer\n' "$TIMER" >&2
    fi
  elif [ "$code" = 255 ]; then
    printf 'Сервер не отвечает: страховочный таймер вернёт прежние sshd и ufw сам, не позже чем через %s с после установки. Запасной вход – консоль cora в панели Selectel.\n' "$CONFIRM_SECONDS" >&2
  else
    printf 'Сервер ответил, но откат по первому соединению не удался (код %s). Таймер попробует сам; что случилось: journalctl -u %s.service. Запасной вход – консоль cora в панели Selectel.\n' "$code" "$TIMER" >&2
  fi
}

cleanup() {
  local status=$?
  if [ "$status" -ne 0 ]; then
    if [ "$ROLLBACK_ARMED" = 1 ]; then
      rollback_now
    fi
    printf '\nОстановлено на шаге «%s».\n' "$CURRENT_STEP" >&2
  fi
  ssh -O exit -o ControlPath="$CONTROL" "$HOST" >/dev/null 2>&1 || true
  rm -rf "$CONTROL_DIR"
  return "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# ---- Состояние сервера: ничего не меняют ----

sshd_conf_matches() {
  printf '%s\n' "$SSHD_CONF_CONTENT" | remote_stdin "cmp -s - $SSH_CONF"
}

sshd_effective_ok() {
  local effective
  effective=$(remote sshd -T) || return 1
  grep -qx 'passwordauthentication no' <<<"$effective" &&
    grep -Eqx 'permitrootlogin (prohibit-password|without-password)' <<<"$effective"
}

ufw_active() {
  local status
  status=$(remote "$UFW status") || return 1
  grep -q '^Status: active' <<<"$status"
}

ufw_rule_present() {
  local added
  added=$(remote "$UFW show added") || return 1
  grep -qx "ufw allow $1" <<<"$added"
}

server_is_configured() {
  local rule
  sshd_conf_matches || return 1
  sshd_effective_ok || return 1
  ufw_active || return 1
  for rule in "${UFW_RULES[@]}"; do
    ufw_rule_present "$rule" || return 1
  done
}

# ---- Шаги ----

open_first_connection() {
  step "Подключение к $HOST"
  local port
  port=$(ssh -G "$HOST" 2>/dev/null | awk '$1 == "port" { print $2 }')
  [ "$port" = 22 ] || fail "ssh-псевдоним $HOST ведёт на порт $port, а ufw разрешит только 22"
  fresh_ssh -o PasswordAuthentication=no -o KbdInteractiveAuthentication=no "$HOST" true ||
    fail "вход по ключу в $HOST не работает: отключать пароль нельзя"
  note "вход по ключу работает"
  ssh -T "${BASE_OPTS[@]}" -o ControlMaster=yes -o ControlPath="$CONTROL" -fN "$HOST"
  note "первое соединение открыто и остаётся открытым до конца"
}

# Таймер от прошлого запуска, не снятый после ufw enable, откатил бы настроенный сервер.
refuse_if_old_timer_pending() {
  step "Страховочный таймер прошлого запуска"
  remote "systemctl reset-failed $TIMER.service $TIMER.timer 2>/dev/null || true"
  if remote "systemctl is-active --quiet $TIMER.timer"; then
    fail "таймер $TIMER от прошлого запуска ещё идёт: дождись его срабатывания или останови: systemctl stop $TIMER.timer"
  fi
  note "нет"
}

install_packages() {
  step "Пакеты Ubuntu: $PACKAGES"
  # shellcheck disable=SC2086 # PACKAGES – имена пакетов через пробел, каждое слово – отдельный аргумент
  remote_script $PACKAGES <<'EOF'
set -eu
missing=
for pkg in "$@"; do
  if ! dpkg-query -W -f='${Status}' "$pkg" 2>/dev/null | grep -q '^install ok installed$'; then
    missing="$missing $pkg"
  fi
done
if [ -z "$missing" ]; then
  echo "    уже установлены"
else
  echo "    ставлю:$missing"
  export DEBIAN_FRONTEND=noninteractive
  apt-get -q -o DPkg::Lock::Timeout=300 update </dev/null
  apt-get -q -o DPkg::Lock::Timeout=300 install -y $missing </dev/null
fi
systemctl enable --now docker
docker_version=$(docker --version)
compose_version=$(docker compose version)
echo "    $docker_version"
echo "    $compose_version"
EOF
}

pull_egress_image() {
  step "Образ $EGRESS_IMAGE для проверки выхода контейнера наружу"
  remote "docker image inspect $EGRESS_IMAGE >/dev/null 2>&1 && echo '    уже есть' || docker pull -q $EGRESS_IMAGE"
}

create_app_dir() {
  step "Каталог $APP_DIR"
  remote "if [ -d $APP_DIR ]; then echo '    уже есть'; else mkdir -p $APP_DIR && echo '    создан'; fi"
}

# Таймер вернёт текущее состояние: выключит ufw, если он был выключен, и восстановит файл sshd (или удалит, если его не было).
# Откат пишет $STATE_DIR/rolled-back, только если прошли все его шаги.
arm_rollback_timer() {
  local seconds=$1
  remote_script "$STATE_DIR" "$SSH_CONF" "$TIMER" "$seconds" <<'EOF'
set -eu
state_dir=$1
conf=$2
timer=$3
seconds=$4
rm -rf "$state_dir"
mkdir -m 700 "$state_dir"
if [ -e "$conf" ]; then
  cp -p "$conf" "$state_dir/sshd-conf-prev"
fi
if LC_ALL=C LANGUAGE=C ufw status | grep -q '^Status: active'; then
  touch "$state_dir/ufw-was-active"
fi
cat > "$state_dir/rollback.sh" <<ROLLBACK
status=0
if [ ! -e $state_dir/ufw-was-active ] && LC_ALL=C LANGUAGE=C ufw status | grep -q '^Status: active'; then ufw --force disable || status=1; fi
if [ -e $state_dir/sshd-conf-prev ]; then cp -p $state_dir/sshd-conf-prev $conf || status=1; else rm -f $conf || status=1; fi
sshd -t && systemctl reload-or-restart ssh || status=1
if [ \$status = 0 ]; then touch $state_dir/rolled-back; fi
exit \$status
ROLLBACK
systemd-run --quiet --unit="$timer" --on-active="${seconds}s" --timer-property=AccuracySec=1s /bin/sh "$state_dir/rollback.sh"
fire_time=$(date -u -d "+$seconds seconds" +%H:%M:%S)
echo "    таймер сработает через ${seconds} с, около $fire_time UTC"
EOF
}

# Ждёт, пока команда на сервере не завершится успешно; false по истечении limit секунд.
wait_remote() {
  local condition=$1 limit=$2 waited=0
  until remote "$condition"; do
    [ "$waited" -lt "$limit" ] || return 1
    sleep 1
    waited=$((waited + 1))
  done
}

# Проверяет путь самой страховки (systemd-run, sh, rollback.sh) до того, как на неё полагаться:
# откат текущего состояния ничего не меняет, но выполняет все свои шаги.
rehearse_rollback_timer() {
  local log
  step "Репетиция страховки: откат текущего состояния через $REHEARSAL_SECONDS с"
  arm_rollback_timer "$REHEARSAL_SECONDS"
  if ! wait_remote "test -e $STATE_DIR/rolled-back" 60; then
    log=$(remote "journalctl -u $TIMER.service -n 15 --no-pager" || true)
    printf '%s\n' "$log" >&2
    fail "за 60 с откат не дошёл до конца: страховке нельзя доверять, ничего не изменено"
  fi
  wait_remote "! systemctl is-active --quiet $TIMER.service && ! systemctl is-active --quiet $TIMER.timer" 30 ||
    fail "после отката таймер не освободился за 30 с"
  note "откат дошёл до конца: systemd-run, sh и rollback.sh работают"
}

verify_new_connection() {
  local methods
  fresh_ssh -o PasswordAuthentication=no -o KbdInteractiveAuthentication=no "$HOST" true ||
    fail "новое соединение по ключу не открылось"
  note "новое соединение по ключу открылось, пока первое открыто"
  methods=$(offered_auth_methods)
  [ "$methods" = publickey ] ||
    fail "сервер всё ещё предлагает входы кроме ключа: ${methods:-ответ не разобран}"
  note "вход по паролю отклоняется, сервер предлагает только publickey"
}

configure_sshd_and_ufw() {
  local rule effective added

  rehearse_rollback_timer

  step "Страховочный таймер на $CONFIRM_SECONDS с"
  arm_rollback_timer "$CONFIRM_SECONDS"
  ROLLBACK_ARMED=1

  step "sshd: $SSH_CONF"
  printf '%s\n' "$SSHD_CONF_CONTENT" | remote_stdin "umask 077 && cat > $SSH_CONF"
  remote sshd -t
  note "sshd -t: конфигурация корректна"
  effective=$(remote "sshd -T | grep -Ei '^(passwordauthentication|permitrootlogin) '")
  note "действующие значения: ${effective//$'\n'/; }"
  sshd_effective_ok || fail "действующие значения sshd не совпали с нужными: файл раньше 10-lists.conf их перебивает"
  remote systemctl reload-or-restart ssh
  note "sshd перечитал настройки"

  step "Проверка входа после перезапуска sshd"
  verify_new_connection

  step "ufw: правила ${UFW_RULES[*]} и включение"
  for rule in "${UFW_RULES[@]}"; do
    added=$(remote "$UFW allow $rule")
    note "$rule: ${added//$'\n'/ }"
  done
  remote "$UFW --force enable" >/dev/null
  note "ufw включён"

  step "Проверка входа после включения ufw"
  verify_new_connection

  step "Доступ подтверждён: снимаю страховочный таймер"
  remote "systemctl stop $TIMER.timer && rm -rf $STATE_DIR"
  ROLLBACK_ARMED=0
  note "таймер снят"
}

check_egress() {
  step "Контейнер выходит наружу при включённом ufw"
  remote "docker run --rm $EGRESS_IMAGE wget -q -T 15 -O /dev/null $EGRESS_URL" ||
    fail "контейнер не дошёл до $EGRESS_URL: без выхода наружу Caddy не получит сертификат Let's Encrypt; ufw уже включён, доступ по ssh подтверждён"
  note "$EGRESS_URL отвечает из контейнера"
}

open_first_connection
refuse_if_old_timer_pending
install_packages
create_app_dir
pull_egress_image

step "SSH и ufw: нужно ли что-то менять"
if server_is_configured; then
  note "sshd и ufw уже настроены, таймер не нужен"
else
  configure_sshd_and_ufw
fi

check_egress

step "Итоговое состояние"
remote "sshd -T | grep -Ei '^(passwordauthentication|permitrootlogin) '; $UFW status"
printf '\nГотово: %s настроен.\n' "$HOST"
