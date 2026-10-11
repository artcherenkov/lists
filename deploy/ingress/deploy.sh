#!/bin/sh
# Доставляет compose.yml на сервер и поднимает прокси. Запуск с ноутбука: sh deploy/ingress/deploy.sh
# Другой сервер: INGRESS_HOST=имя-из-ssh-config sh deploy/ingress/deploy.sh
set -eu
target=${INGRESS_HOST:-lists}
dir=/opt/ingress
cd "$(dirname "$0")"
# shellcheck disable=SC2029 # $dir подставляется здесь намеренно: на сервере его нет
ssh "$target" "mkdir -p $dir"
scp compose.yml "$target:$dir/compose.yml"
# shellcheck disable=SC2029 # $dir подставляется здесь намеренно: на сервере его нет
ssh "$target" "cd $dir && docker compose pull --quiet && docker compose up -d --wait --wait-timeout 60 && docker compose ps"
