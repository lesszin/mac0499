#!/bin/bash

set -e

export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-tcc}"

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

BACKUP_DIR="$PROJECT_DIR/../tcc-backup"

CULTURAEDUCA_DUMP="$BACKUP_DIR/culturaeduca.dump"
METABASE_DUMP="$BACKUP_DIR/metabase.dump"

echo "========================================"
echo " Instalação da plataforma"
echo "========================================"

if ! command -v docker >/dev/null 2>&1; then
    echo "ERRO: Docker não encontrado."
    exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
    echo "ERRO: Docker Compose não encontrado."
    exit 1
fi

cd "$PROJECT_DIR"

if [ ! -f ".env" ]; then
    echo "ERRO: arquivo .env não encontrado."
    echo "Crie o .env antes de executar a instalação."
    exit 1
fi

if [ ! -f "$CULTURAEDUCA_DUMP" ]; then
    echo "ERRO: backup do culturaeduca não encontrado:"
    echo "$CULTURAEDUCA_DUMP"
    exit 1
fi

if [ ! -f "$METABASE_DUMP" ]; then
    echo "ERRO: backup do Metabase não encontrado:"
    echo "$METABASE_DUMP"
    exit 1
fi

echo ""
echo "[1/5] Subindo PostgreSQL..."

docker compose up -d postgres

echo ""
echo "[2/5] Aguardando PostgreSQL ficar saudável..."

until [ "$(docker inspect -f '{{.State.Health.Status}}' "$(docker compose ps -q postgres)" 2>/dev/null)" = "healthy" ]; do
    sleep 2
done

echo "PostgreSQL está saudável."

echo ""
echo "[3/5] Restaurando banco culturaeduca..."

cat "$CULTURAEDUCA_DUMP" | \
docker compose exec -T postgres \
pg_restore \
    -U postgres \
    -d culturaeduca

echo "culturaeduca restaurado."

echo ""
echo "[4/5] Restaurando e configurando banco do Metabase..."

cat "$METABASE_DUMP" | \
docker compose exec -T postgres \
pg_restore \
    -U postgres \
    -d metabase

echo "Banco do Metabase restaurado."

echo ""
echo "Corrigindo conexão CulturaEduca do Metabase..."

docker compose exec -T postgres \
psql -U postgres -d metabase \
-c "UPDATE metabase_database
    SET details = jsonb_set(
                    jsonb_set(
                        details::jsonb,
                        '{host}',
                        '\"postgres\"'::jsonb
                    ),
                    '{ssl}',
                    'false'::jsonb
                  )::text
    WHERE name = 'CulturaEduca';"

echo "Conexão CulturaEduca corrigida."

echo ""
echo "[5/5] Subindo aplicação e Metabase..."

docker compose up -d app metabase

echo ""
echo "========================================"
echo " Instalação concluída"
echo "========================================"

docker compose ps