# 🚀 CANSF - Guia Rápido Docker

## Instalação Ultra-Rápida (3 Comandos)

```bash
# 1. Entre na pasta do projeto
cd /app

# 2. Inicie o sistema completo
./start-docker.sh

# 3. Acesse o sistema
# Abra http://localhost no navegador
```

Pronto! O sistema está funcionando com banco de dados incluído! 🎉

---

## O Que Acontece Quando Você Inicia?

✅ **MongoDB** - Banco de dados é criado e configurado
✅ **Backend FastAPI** - API REST é iniciada
✅ **Frontend React** - Interface web é servida
✅ **Volumes** - Dados são persistidos automaticamente

---

## Comandos Essenciais

### Iniciar
```bash
./start-docker.sh
```
ou
```bash
docker-compose up -d
```

### Parar
```bash
./stop-docker.sh
```
ou
```bash
docker-compose down
```

### Ver Logs em Tempo Real
```bash
docker-compose logs -f
```

### Ver Logs de Serviço Específico
```bash
docker-compose logs -f backend    # Backend
docker-compose logs -f frontend   # Frontend
docker-compose logs -f mongodb    # Banco de dados
```

### Reiniciar
```bash
docker-compose restart
```

### Status
```bash
docker-compose ps
```

---

## URLs de Acesso

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost | Interface do usuário |
| **Backend API** | http://localhost/api | API REST |
| **MongoDB** | localhost:27017 | Banco de dados |

---

## Personalização

### 1. Alterar Senhas e Configurações

Edite o arquivo `.env`:

```bash
nano .env
```

Principais configurações:
- `MONGO_ROOT_PASSWORD` - Senha do MongoDB
- `REACT_APP_BACKEND_URL` - URL do backend

### 2. Alterar Portas

Edite `docker-compose.yml`:

```yaml
# Para usar porta 8080 em vez de 80:
frontend:
  ports:
    - "8080:80"
```

---

## Backup e Restore

### Fazer Backup
```bash
docker-compose exec -T mongodb mongodump \
  --username admin \
  --password cansf_secure_password_2026 \
  --db cansf_db \
  --archive > backup_$(date +%Y%m%d_%H%M%S).dump
```

### Restaurar Backup
```bash
docker-compose exec -T mongodb mongorestore \
  --username admin \
  --password cansf_secure_password_2026 \
  --archive < backup_20260204_120000.dump
```

---

## Solução de Problemas

### ❌ Porta já em uso
```bash
# Pare outros serviços na porta 80
sudo lsof -i :80
# ou altere a porta no docker-compose.yml
```

### ❌ Serviço não inicia
```bash
# Veja os logs
docker-compose logs -f

# Reconstrua as imagens
docker-compose build --no-cache
docker-compose up -d
```

### ❌ Resetar completamente
```bash
# ATENÇÃO: Apaga TODOS os dados!
docker-compose down -v
docker-compose up -d --build
```

---

## Comandos Avançados

### Acessar Shell do Backend
```bash
docker-compose exec backend bash
```

### Acessar MongoDB Shell
```bash
docker-compose exec mongodb mongosh \
  -u admin \
  -p cansf_secure_password_2026 \
  --authenticationDatabase admin
```

### Ver uso de recursos
```bash
docker stats
```

### Limpar recursos não utilizados
```bash
docker system prune -a
```

---

## Estrutura dos Serviços

```
CANSF Sistema Docker
│
├── 🗄️  MongoDB (porta 27017)
│   ├── Volume: mongodb_data (persistente)
│   └── Healthcheck: ping database
│
├── 🐍 Backend FastAPI (porta 8001)
│   ├── Volume: backend_uploads (arquivos PDF)
│   ├── Conexão: mongodb://mongodb:27017
│   └── Healthcheck: GET /api/stats
│
└── ⚛️  Frontend React (porta 80)
    ├── Nginx como servidor web
    ├── Proxy: /api → backend:8001
    └── Build otimizado de produção
```

---

## Checklist de Produção

Para usar em produção, certifique-se de:

- [ ] Alterar todas as senhas em `.env`
- [ ] Configurar HTTPS (use Traefik ou Nginx Proxy Manager)
- [ ] Configurar backups automáticos do MongoDB
- [ ] Configurar monitoramento (Prometheus + Grafana)
- [ ] Limitar recursos dos containers (CPU, memória)
- [ ] Configurar logs externos (ELK Stack ou similar)
- [ ] Revisar CORS_ORIGINS para domínios corretos
- [ ] Testar restore de backup

---

## Especificações Técnicas

- **Backend**: Python 3.11 + FastAPI + Motor (async MongoDB)
- **Frontend**: Node 18 + React + Nginx
- **Database**: MongoDB 7.0
- **Arquitetura**: Multi-container com rede interna isolada
- **Volumes**: Persistência automática de dados
- **Health Checks**: Monitoramento de saúde dos serviços

---

## Suporte

Para mais detalhes, consulte:
- 📖 [README.docker.md](README.docker.md) - Documentação completa
- 🐳 [Docker Docs](https://docs.docker.com)
- 📦 [MongoDB Docs](https://docs.mongodb.com)
- ⚡ [FastAPI Docs](https://fastapi.tiangolo.com)

---

**Sistema criado por:** [Seu Nome/Empresa]  
**Versão:** 1.0.0  
**Data:** Fevereiro 2026
