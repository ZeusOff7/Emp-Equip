#!/bin/bash

# CANSF - Script de Inicialização Docker
# ========================================

set -e

echo "╔════════════════════════════════════════════╗"
echo "║  CANSF - Sistema de Gestão de Empréstimos ║"
echo "║         Inicialização Docker               ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado!"
    echo "   Instale Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose não está instalado!"
    echo "   Instale Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✓ Docker instalado"
echo "✓ Docker Compose instalado"
echo ""

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.docker .env
    echo "✓ Arquivo .env criado"
    echo "   ATENÇÃO: Edite .env para personalizar senhas e configurações!"
    echo ""
fi

# Comando a ser executado
COMPOSE_CMD="docker-compose"
if ! command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker compose"
fi

echo "🚀 Iniciando serviços..."
echo ""

# Parar containers existentes (se houver)
$COMPOSE_CMD down 2>/dev/null || true

# Construir e iniciar containers
$COMPOSE_CMD up -d --build

echo ""
echo "⏳ Aguardando serviços iniciarem..."
sleep 10

# Verificar status dos containers
echo ""
echo "📊 Status dos Serviços:"
$COMPOSE_CMD ps

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║         Sistema Iniciado com Sucesso!      ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "🌐 URLs de Acesso:"
echo "   Frontend:    http://localhost"
echo "   Backend API: http://localhost/api"
echo "   MongoDB:     localhost:27017"
echo ""
echo "📚 Comandos Úteis:"
echo "   Ver logs:         $COMPOSE_CMD logs -f"
echo "   Parar serviços:   $COMPOSE_CMD down"
echo "   Reiniciar:        $COMPOSE_CMD restart"
echo "   Status:           $COMPOSE_CMD ps"
echo ""
echo "📖 Para mais informações, consulte: README.docker.md"
echo ""
