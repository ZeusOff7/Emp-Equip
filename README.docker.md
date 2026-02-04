# CANSF - Sistema de Gestão de Empréstimos
## Guia de Instalação Docker

### Pré-requisitos
- Docker (versão 20.10 ou superior)
- Docker Compose (versão 2.0 ou superior)

### Instalação Rápida

1. **Clone o repositório e entre na pasta:**
```bash
cd /app
```

2. **Configure as variáveis de ambiente (opcional):**
```bash
cp .env.docker .env
# Edite .env se necessário para alterar senhas e configurações
```

3. **Inicie todos os serviços:**
```bash
docker-compose up -d
```

4. **Aguarde os serviços iniciarem (cerca de 30 segundos)**

5. **Acesse a aplicação:**
- Frontend: http://localhost
- Backend API: http://localhost/api
- MongoDB: localhost:27017

### Comandos Úteis

**Ver logs de todos os serviços:**
```bash
docker-compose logs -f
```

**Ver logs de um serviço específico:**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

**Parar todos os serviços:**
```bash
docker-compose down
```

**Parar e remover volumes (ATENÇÃO: apaga dados do banco):**
```bash
docker-compose down -v
```

**Reiniciar um serviço específico:**
```bash
docker-compose restart backend
```

**Reconstruir imagens:**
```bash
docker-compose build
docker-compose up -d
```

**Verificar status dos serviços:**
```bash
docker-compose ps
```

**Acessar shell do container:**
```bash
# Backend
docker-compose exec backend bash

# MongoDB
docker-compose exec mongodb mongosh -u admin -p cansf_secure_password_2026
```

### Estrutura de Serviços

- **mongodb**: Banco de dados MongoDB 7.0
  - Porta: 27017
  - Usuário: admin
  - Senha: definida em .env
  - Volume persistente: mongodb_data

- **backend**: API FastAPI
  - Porta: 8001
  - Health check: /api/stats
  - Volume: /app/uploads para arquivos PDF

- **frontend**: React com Nginx
  - Porta: 80
  - Proxy reverso para /api → backend:8001

### Solução de Problemas

**Erro: Porta já em uso**
```bash
# Altere as portas no docker-compose.yml
# Por exemplo, para usar porta 8080 em vez de 80:
ports:
  - "8080:80"
```

**Backend não conecta ao MongoDB**
```bash
# Verifique os logs
docker-compose logs mongodb
docker-compose logs backend

# Reinicie os serviços
docker-compose restart
```

**Frontend não carrega**
```bash
# Reconstrua a imagem do frontend
docker-compose build frontend
docker-compose up -d frontend
```

**Resetar completamente o sistema**
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Backup e Restore

**Backup do banco de dados:**
```bash
docker-compose exec -T mongodb mongodump \
  --username admin \
  --password cansf_secure_password_2026 \
  --db cansf_db \
  --archive > backup_$(date +%Y%m%d_%H%M%S).dump
```

**Restore do banco de dados:**
```bash
docker-compose exec -T mongodb mongorestore \
  --username admin \
  --password cansf_secure_password_2026 \
  --archive < backup_20260204_120000.dump
```

### Variáveis de Ambiente

Edite o arquivo `.env` para personalizar:

- `MONGO_ROOT_USERNAME`: Usuário admin do MongoDB
- `MONGO_ROOT_PASSWORD`: Senha do MongoDB
- `MONGO_DATABASE`: Nome do banco de dados
- `CORS_ORIGINS`: Origens permitidas para CORS
- `REACT_APP_BACKEND_URL`: URL do backend para o frontend

### Produção

Para ambiente de produção:

1. Altere as senhas em `.env`
2. Configure HTTPS (use reverse proxy como Traefik ou Nginx)
3. Desabilite hot-reload no backend
4. Configure backups automáticos do MongoDB
5. Use volumes nomeados para dados críticos

### Suporte

Para mais informações, consulte:
- Documentação do Docker: https://docs.docker.com
- Documentação do MongoDB: https://docs.mongodb.com
- Documentação do FastAPI: https://fastapi.tiangolo.com
