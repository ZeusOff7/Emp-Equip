#!/bin/bash

# CANSF - Script de Parada Docker
# =================================

set -e

echo "🛑 Parando CANSF..."
echo ""

# Determinar comando Docker Compose
COMPOSE_CMD="docker-compose"
if ! command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker compose"
fi

# Parar e remover containers
$COMPOSE_CMD down

echo ""
echo "✓ Serviços parados com sucesso!"
echo ""
echo "💡 Dica: Para remover volumes (apaga dados do banco):"
echo "   $COMPOSE_CMD down -v"
echo ""
