# CRM Flow — Guia do Projeto

> Plataforma SaaS que permite empresas criarem seus próprios CRMs personalizados via API,
> sem precisar alterar código ou banco de dados.

---

## Sumário

1. [O que é este projeto?](#1-o-que-é-este-projeto)
2. [Como a arquitetura funciona?](#2-como-a-arquitetura-funciona)
3. [Conceitos importantes explicados](#3-conceitos-importantes-explicados)
4. [O que já foi construído](#4-o-que-já-foi-construído)
5. [Como rodar localmente](#5-como-rodar-localmente)
6. [Testando os endpoints](#6-testando-os-endpoints)
7. [Estrutura de pastas](#7-estrutura-de-pastas)
8. [Próximos passos](#8-próximos-passos)

---

## 1. O que é este projeto?

Imagine que três empresas diferentes querem usar um CRM:

- A **Empresa A** quer gerenciar "Leads" com campos: nome, telefone, status
- A **Empresa B** quer gerenciar "Clientes" com campos: CNPJ, segmento, valor do contrato
- A **Empresa C** quer gerenciar "Oportunidades" com campos completamente diferentes

O CRM Flow permite que **cada empresa defina suas próprias entidades e campos via API**, sem precisar de programação. Um administrador acessa a API, cria uma entidade chamada "Lead" com os campos que quiser, e imediatamente consegue criar, editar e buscar registros dessa entidade.

É o mesmo sistema que a [Sydle One](https://www.sydle.com) usa — e o objetivo é demonstrar domínio dessa arquitetura como portfólio sênior.

---

## 2. Como a arquitetura funciona?

O projeto é dividido em **6 microsserviços**. Cada um é um programa Spring Boot independente que faz uma coisa bem específica:

```
                        INTERNET
                            │
                    ┌───────▼────────┐
                    │  API Gateway   │  :8080
                    │  (porteiro)    │
                    └───────┬────────┘
                            │ valida quem você é (JWT)
          ┌─────────────────┼─────────────────┐
          │                 │                 │
  ┌───────▼──────┐  ┌───────▼──────┐  ┌──────▼────────┐
  │ Auth Service │  │Tenant Service│  │Entity Engine  │
  │   :8081      │  │   :8082      │  │   :8083       │
  │ (login/JWT)  │  │(empresas)    │  │(CRM dinâmico) │
  └──────────────┘  └──────────────┘  └───────┬───────┘
                                              │
                              ┌───────────────┼──────────────┐
                              │               │              │
                     ┌────────▼──────┐  ┌─────▼──────┐  RabbitMQ
                     │  Permission   │  │ Analytics  │  (mensageria)
                     │  Service :8084│  │Service:8085│
                     │ (permissões)  │  │(relatórios)│
                     └───────────────┘  └────────────┘
```

### O fluxo de uma requisição

1. Você faz uma chamada HTTP (ex: criar um Lead)
2. O **API Gateway** recebe, verifica se você tem um token JWT válido
3. Encaminha para o **Entity Engine**
4. O Entity Engine pergunta ao **Permission Service** se você tem permissão
5. Se sim, salva o registro no banco de dados
6. Publica um evento no **RabbitMQ** dizendo "um Lead foi criado"
7. O **Analytics Service** recebe esse evento e atualiza as estatísticas

---

## 3. Conceitos importantes explicados

### O que é JWT (JSON Web Token)?

É um "crachá digital" que prova quem você é.

Quando você faz login, o sistema te entrega um JWT — uma string longa que parece:
```
eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyLXV1aWQi...
```

Esse token contém informações como seu ID, suas permissões e quando expira. Você inclui ele em toda requisição no header:
```
Authorization: Bearer eyJhbGci...
```

**Por que RS256?** O token é assinado com uma chave privada (só o auth-service tem) e qualquer outro serviço consegue verificar a assinatura usando a chave pública — sem precisar consultar o banco de dados a cada requisição.

---

### O que é Multi-tenancy / Schema-per-tenant?

**Tenant** = cada empresa cliente da plataforma.

O banco de dados é único, mas os dados de cada empresa ficam isolados em **schemas separados do PostgreSQL**:

```
PostgreSQL (um banco: crmflow_db)
├── schema: public          → dados globais (usuários, tenants)
├── schema: tenant_acme     → dados da empresa "Acme"
│   ├── entity_definitions  → quais entidades a Acme criou
│   ├── entity_records      → os registros (Leads, Clientes...)
│   └── permission_roles    → permissões da Acme
├── schema: tenant_foobar   → dados isolados da empresa "Foobar"
└── schema: tenant_<slug>   → criado automaticamente ao cadastrar empresa
```

É como se cada empresa tivesse seu próprio mini-banco dentro do mesmo PostgreSQL. Impossível vazar dados entre empresas por bug.

---

### O que é o Dynamic Entity Engine?

É o coração do sistema. Em vez de ter tabelas fixas no banco (`leads`, `clientes`, etc.), ele usa um campo **JSONB** no PostgreSQL para armazenar qualquer estrutura de dados.

**JSONB** = formato JSON salvo de forma indexável e pesquisável no PostgreSQL.

```json
// Registro de Lead (armazenado como JSONB)
{
  "nome": "João Silva",
  "status": "qualificado",
  "score": 87,
  "telefone": "+55 11 99999-0000"
}

// Registro de Cliente (mesma tabela, estrutura diferente)
{
  "cnpj": "00.000.000/0001-00",
  "segmento": "tecnologia",
  "valor_contrato": 50000
}
```

Os dois ficam na tabela `entity_records`, mas o JSONB permite armazenar qualquer estrutura.

---

### O que é Flyway?

É uma ferramenta que garante que o banco de dados seja criado/atualizado corretamente ao subir o sistema.

Em vez de você criar as tabelas na mão, o Flyway executa os arquivos SQL em ordem:
```
V1__create_users_table.sql  → cria tabela users
V2__outra_migration.sql     → executa em seguida
```

Se a tabela já existe (sistema já foi iniciado antes), ele não executa de novo.

---

### O que é RabbitMQ?

É um serviço de mensageria — funciona como um "correio interno".

Quando o Entity Engine salva um novo registro, ele não chama o Analytics Service diretamente. Em vez disso, posta uma mensagem no RabbitMQ:
```
"Um Lead foi criado pelo tenant Acme com esses dados..."
```

O Analytics Service está "escutando" essa fila e quando recebe a mensagem, atualiza suas estatísticas. Isso desacopla os serviços — se o Analytics cair por alguns minutos, as mensagens ficam na fila até ele voltar.

---

### O que é Redis?

É um banco de dados em memória — extremamente rápido.

Usamos para duas coisas:
1. **Refresh tokens**: guardamos o token de renovação de sessão com TTL de 7 dias
2. **Cache de schemas**: schemas de entidades são cacheados por 10 minutos para não consultar o banco toda vez

---

### O que é Resilience4j?

É uma biblioteca de resiliência. Quando o Entity Engine chama o Permission Service, ele usa um **Circuit Breaker** (disjuntor):

```
Normal:     Entity Engine → Permission Service → resposta OK ✓
Falha:      Entity Engine → Permission Service → timeout × 3
Disjuntor:  Após 3 falhas, para de chamar por 30 segundos
Fallback:   Enquanto disjuntor aberto, usa permissão padrão (allow)
```

Evita que a falha de um serviço derrube todos os outros.

---

## 4. O que já foi construído

### ✅ Setup do Monorepo Maven

- `pom.xml` pai com todas as dependências versionadas
- Estrutura completa dos 6 microsserviços
- `docker-compose.yml` para infra (Postgres, Redis, RabbitMQ)
- Script `mvnw` (baixa Maven automaticamente, sem instalação manual)
- Script `dev.sh` para rodar qualquer serviço localmente

### ✅ Auth Service (completo) — porta 8081

O único serviço que **emite** tokens JWT. Todos os outros só validam.

**Endpoints disponíveis:**

| Método | URL | O que faz |
|--------|-----|-----------|
| `POST` | `/api/v1/auth/register` | Cadastra novo usuário |
| `POST` | `/api/v1/auth/login` | Retorna access token + refresh token |
| `POST` | `/api/v1/auth/refresh` | Renova o access token |
| `POST` | `/api/v1/auth/logout` | Invalida o refresh token |
| `GET`  | `/api/v1/auth/me` | Dados do usuário logado |

**Funcionalidades implementadas:**
- Senha armazenada com BCrypt (hash seguro, jamais em texto puro)
- Chaves RSA 2048-bit geradas em `auth-service/src/main/resources/keys/`
- Access token expira em 15 minutos
- Refresh token expira em 7 dias (armazenado no Redis com hash SHA-256)
- Validação de senha forte (mínimo 8 caracteres, maiúscula, número, especial)
- Flyway cria a tabela `users` automaticamente na primeira inicialização

### ✅ Tenant Service (completo) — porta 8082

Gerencia as empresas clientes e seus usuários.

**Endpoints disponíveis:**

| Método | URL | O que faz |
|--------|-----|-----------|
| `POST` | `/api/v1/tenants` | Cria empresa + provisiona schema PostgreSQL |
| `GET`  | `/api/v1/tenants` | Lista todas as empresas |
| `GET`  | `/api/v1/tenants/{id}` | Busca empresa por ID |
| `PUT`  | `/api/v1/tenants/{id}` | Atualiza dados da empresa |
| `DELETE` | `/api/v1/tenants/{id}` | Desativa empresa |
| `POST` | `/api/v1/tenants/{id}/users` | Adiciona usuário à empresa |
| `GET`  | `/api/v1/tenants/{id}/users` | Lista usuários da empresa |
| `DELETE` | `/api/v1/tenants/{id}/users/{uid}` | Remove usuário da empresa |

**O que acontece ao criar uma empresa:**
1. Salva registro na tabela `public.tenants`
2. Cria schema `tenant_<slug>` no PostgreSQL
3. Aplica 4 migrations SQL (entity_definitions, entity_records, relationships, permissions)
4. Insere automaticamente as 4 roles padrão: `TENANT_ADMIN`, `MANAGER`, `OPERATOR`, `VIEWER`

### ✅ Esqueletos dos outros serviços

Os 4 serviços restantes têm a estrutura básica criada (pom.xml, Application.java, application.yml, Dockerfile) e estão prontos para implementação:
- **Entity Engine** (:8083) — próximo a implementar
- **Permission Service** (:8084)
- **Analytics Service** (:8085)
- **API Gateway** (:8080)

### ✅ Migrations SQL

Todas as tabelas do banco de dados são criadas automaticamente via Flyway:

| Arquivo | Serviço | O que cria |
|---------|---------|------------|
| `V1__create_users_table.sql` | auth-service | Tabela de usuários |
| `V1__create_tenants_tables.sql` | tenant-service | Tabelas de empresas e membros |
| `V1__create_entity_events_table.sql` | analytics-service | Tabela de eventos para analytics |
| `V1-V4` no diretório `tenant/` | entity-engine | Tabelas criadas em cada schema de tenant |

---

## 5. Como rodar localmente

### Pré-requisitos

- Docker instalado e rodando
- Java 21 JDK instalado (`sudo dnf install java-21-openjdk-devel`)

### Passo 1 — Subir a infraestrutura

```bash
cd /home/diegopedro/Documentos/CRMFlow_ClaudeCode/crmflow

# Sobe Postgres, Redis e RabbitMQ (apenas infraestrutura)
docker-compose up -d postgres redis rabbitmq

# Verificar se estão saudáveis
docker ps
```

### Passo 2 — Rodar um serviço

```bash
# Em um terminal, rode o auth-service
./dev.sh auth-service

# Em outro terminal (separado), rode o tenant-service
./dev.sh tenant-service
```

O script `dev.sh` faz tudo automaticamente:
- Detecta o Java 21
- Verifica se a infra está no ar
- Faz o build Maven
- Inicia o serviço

### Passo 3 — Acessar o Swagger UI

Cada serviço tem documentação interativa onde você pode testar os endpoints sem precisar de Postman ou curl:

| Serviço | URL do Swagger |
|---------|----------------|
| auth-service | http://localhost:8081/swagger-ui |
| tenant-service | http://localhost:8082/swagger-ui |
| entity-engine | http://localhost:8083/swagger-ui |
| permission-service | http://localhost:8084/swagger-ui |
| analytics-service | http://localhost:8085/swagger-ui |

---

## 6. Testando os endpoints

### Exemplos com curl (linha de comando)

**Registrar um usuário:**
```bash
curl -X POST http://localhost:8081/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@empresa.com",
    "password": "Senha@123",
    "name": "João Silva"
  }'
```

**Fazer login:**
```bash
curl -X POST http://localhost:8081/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@empresa.com",
    "password": "Senha@123"
  }'
```
Guarde o `accessToken` da resposta.

**Ver seus dados (requer token):**
```bash
curl http://localhost:8081/api/v1/auth/me \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Criar uma empresa (requer token):**
```bash
curl -X POST http://localhost:8082/api/v1/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "name": "Empresa Acme",
    "slug": "acme"
  }'
```
> O `slug` vira o nome do schema no PostgreSQL: `tenant_acme`

### Formato de resposta padrão

Todas as respostas seguem o mesmo padrão:

```json
{
  "data": { ... },        ← os dados em si
  "message": "OK",        ← mensagem humana
  "success": true         ← true = sucesso, false = erro
}
```

Erros retornam:
```json
{
  "error": "VALIDATION_ERROR",
  "message": "password: Senha deve ter mínimo 8 caracteres...",
  "status": 400,
  "timestamp": "2026-04-22T14:24:48Z"
}
```

---

## 7. Estrutura de pastas

```
crmflow/
├── pom.xml                     ← POM pai do monorepo Maven
├── docker-compose.yml          ← Sobe toda a infraestrutura
├── mvnw                        ← Baixa Maven automaticamente
├── dev.sh                      ← Script para rodar serviços localmente
├── .gitignore
│
├── infra/
│   ├── init.sql                ← Extensões PostgreSQL (pgcrypto, pg_trgm)
│   └── generate-keys.sh        ← Gera chaves RSA para desenvolvimento
│
├── auth-service/               ← Autenticação e tokens JWT
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/main/java/com/crmflow/auth/
│       ├── controller/         ← Recebe as requisições HTTP
│       ├── service/            ← Lógica de negócio
│       ├── repository/         ← Acesso ao banco de dados
│       ├── model/              ← Entidades JPA (tabelas)
│       ├── dto/                ← Records Java (objetos de entrada/saída)
│       ├── security/           ← Configuração de segurança e filtro JWT
│       ├── config/             ← Carregamento das chaves RSA
│       ├── exception/          ← Tratamento de erros
│       └── validation/         ← Validação de senha forte
│
├── tenant-service/             ← Gestão de empresas clientes
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/main/java/com/crmflow/tenant/
│       ├── controller/         ← Endpoints REST de tenants
│       ├── service/
│       │   ├── TenantService           ← CRUD de tenants/usuários
│       │   └── TenantSchemaService     ← Provisiona schema PostgreSQL
│       ├── repository/
│       ├── model/              ← Tenant + TenantUser
│       └── dto/                ← Records de request/response
│
├── entity-engine/              ← Motor de CRM dinâmico (a implementar)
├── permission-service/         ← Permissões RBAC/ABAC (a implementar)
├── analytics-service/          ← Relatórios e eventos (a implementar)
└── api-gateway/                ← Roteamento e JWT gateway (a implementar)
```

---

## 8. Próximos passos

Seguindo o roadmap em `.claude/docs/roadmap.md`:

### Em seguida: Entity Engine — Fase 1

Implementar o gerenciamento de schemas de entidades:
- Criar entidades via API (ex: definir que "Lead" tem campos nome, status, score)
- Listar, atualizar e remover entidades
- Cache Redis para schemas frequentemente acessados

### Depois: Entity Engine — Fase 2

Implementar o CRUD de registros dinâmicos:
- Criar, listar, buscar e deletar registros de qualquer entidade
- Validação do payload contra o schema definido
- Filtros dinâmicos dentro do JSONB
- Publicação de eventos no RabbitMQ

### E depois: API Gateway, Permission Service, Analytics

---

## Tecnologias utilizadas

| O quê | Por quê |
|-------|---------|
| **Java 21 + Virtual Threads** | Alta concorrência sem complexidade de threads manuais |
| **Spring Boot 3.3** | Framework principal, ecosistema maduro |
| **PostgreSQL 16 + JSONB** | Banco relacional com suporte a JSON indexável |
| **Schema-per-tenant** | Isolamento total de dados entre empresas clientes |
| **JWT RS256** | Tokens verificáveis sem consulta ao banco em cada requisição |
| **Redis 7** | Cache e armazenamento de sessões (refresh tokens) |
| **RabbitMQ** | Comunicação assíncrona desacoplada entre serviços |
| **Flyway** | Controle de versão do banco de dados |
| **Spring Cloud Gateway** | Roteamento centralizado e autenticação na borda |
| **Resilience4j** | Circuit breaker para tolerância a falhas |
| **Docker Compose** | Ambiente local reproduzível em qualquer máquina |
