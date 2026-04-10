# 💳 Service Payment

Microsserviço de processamento de pagamentos integrado com a API da Stripe. Faz parte de um sistema maior de reservas de hotel, se comunicando de forma assíncrona com o microsserviço de reservas via RabbitMQ.

---

## 🛠 Tecnologias

- **[NestJS](https://nestjs.com/)** — Framework principal
- **[Fastify](https://fastify.dev/)** — Adapter HTTP
- **[Stripe](https://stripe.com/)** — Processamento de pagamentos
- **[RabbitMQ](https://www.rabbitmq.com/)** (amqplib + amqp-connection-manager) — Mensageria entre microsserviços
- **[Prisma](https://www.prisma.io/)** — ORM
- **[PostgreSQL](https://www.postgresql.org/)** — Banco de dados
- **[JWT + Passport](https://docs.nestjs.com/security/authentication)** — Autenticação e proteção de rotas
- **[Zod](https://zod.dev/)** — Validação de dados
- **[Jest](https://jestjs.io/)** — Testes unitários e e2e

---

## 🏗 Arquitetura

```
[Cliente] → [Service Payment] → [Stripe]
                  ↓
             [RabbitMQ]
                  ↓
        [Service Reservations]
```

O fluxo principal:
1. Um pagamento é iniciado via endpoint da API
2. O Stripe processa o pagamento e emite eventos via **webhook**
3. Os eventos são processados e persistidos no banco
4. Uma mensagem é publicada no RabbitMQ para confirmar ou cancelar a reserva no microsserviço de reservas
5. Um **scheduler** roda a cada 5 minutos para reprocessar eventos que falharam

---

## 🔐 Autenticação

Todas as rotas do módulo `/payment` são protegidas com **JWT**. O token deve ser enviado no header:

```
Authorization: Bearer <token>
```

As rotas de `/webhook` são públicas, mas validadas via assinatura do Stripe.

---

## 📡 Endpoints

### Payment — `/payment`

> Todas as rotas requerem autenticação JWT.

---

#### `POST /payment`
Cria um novo Payment Intent no Stripe.

**Body:**
```json
{
  "reservationId": 1,
  "userId": 42,
  "amount": 15000,
  "method": "card",
  "currency": "brl",
  "customerEmail": "user@email.com"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `reservationId` | `number` | ✅ | ID da reserva vinculada ao pagamento |
| `userId` | `number` | ✅ | ID do usuário que está pagando |
| `amount` | `number` | ✅ | Valor em centavos (ex: `15000` = R$ 150,00) |
| `method` | `Method` | ✅ | Método de pagamento (ex: `card`) |
| `currency` | `Currency` | ❌ | Moeda do pagamento (ex: `brl`). Padrão definido internamente |
| `customerEmail` | `string` | ❌ | E-mail do cliente para notificações do Stripe |

**Response `201`:**
```json
{
  "payment": {
    "id": 1,
    "stripePaymentIntentId": "pi_xxx",
    "clientSecret": "pi_xxx_secret_xxx",
    "reservationId": 1,
    "amount": 15000,
    "currency": "brl",
    "status": "requires_payment_method",
    "captureMethod": "manual"
  }
}
```

| Status | Descrição |
|--------|-----------|
| `201` | Payment Intent criado com sucesso |
| `400` | Dados inválidos ou valor zerado |

---

#### `GET /payment/:id`
Busca um pagamento pelo ID.

**Response `200`:**
```json
{
  "id": 1,
  "stripePaymentIntentId": "pi_xxx",
  "clientSecret": "pi_xxx_secret_xxx",
  "reservationId": 1,
  "amount": 15000,
  "currency": "brl",
  "status": "requires_capture",
  "captureMethod": "manual"
}
```

| Status | Descrição |
|--------|-----------|
| `200` | Pagamento encontrado |
| `400` | ID inválido |
| `404` | Pagamento não encontrado |

---

#### `GET /payment/reservation/:reservationId`
Busca todos os pagamentos de uma reserva.

**Response `200`:**
```json
[
  {
    "id": 1,
    "reservationId": 1,
    "amountAuthorized": 15000,
    "amountCaptured": 15000,
    "status": "succeeded",
    "currency": "brl",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

| Status | Descrição |
|--------|-----------|
| `200` | Lista de pagamentos da reserva |
| `400` | ID inválido |
| `404` | Nenhum pagamento encontrado para a reserva |

---

#### `DELETE /payment/:id`
Realiza o reembolso de um pagamento. O usuário autenticado é identificado via token JWT.

| Status | Descrição |
|--------|-----------|
| `200` | Reembolso realizado |
| `400` | ID inválido |
| `403` | Pagamento não pode ser reembolsado |
| `404` | Pagamento não encontrado |

---

#### `POST /payment/capture`
Captura um pagamento previamente autorizado. Utilizado quando o `captureMethod` é `manual`.

**Body:**
```json
{
  "id": 1,
  "userId": 42,
  "amount": 15000,
  "method": "card"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | `number` | ✅ | ID do pagamento a ser capturado |
| `userId` | `number` | ✅ | ID do usuário realizando a captura |
| `amount` | `number` | ✅ | Valor a capturar em centavos |
| `method` | `Method` | ❌ | Método de pagamento |

| Status | Descrição |
|--------|-----------|
| `200` | Pagamento capturado com sucesso |
| `400` | Dados inválidos, valor zerado ou acima do autorizado |
| `403` | Captura automática ativada ou pagamento não pode ser capturado |
| `404` | Pagamento não encontrado |

---

### Webhook — `/webhook`

> Rota pública, validada via assinatura do Stripe (`stripe-signature`).

#### `POST /webhook/confirm`
Recebe e processa eventos enviados pelo Stripe. Após o processamento, publica uma mensagem no RabbitMQ para o microsserviço de reservas confirmar ou cancelar a reserva.

**Headers obrigatórios:**
```
stripe-signature: <assinatura-gerada-pelo-stripe>
```

**Response `200`:**
```json
{
  "received": true
}
```

| Status | Descrição |
|--------|-----------|
| `200` | Evento recebido e processado |
| `400` | Body ausente ou assinatura inválida |

---

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com base nas variáveis abaixo:

```env
# Banco de dados
DATABASE_URL=postgresql://user:password@localhost:5432/service_payment

# JWT
JWT_SECRET=your_jwt_secret

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_QUEUE=reservations
```

---

## 🚀 Como rodar

### Pré-requisitos

- Node.js 20+
- Docker e Docker Compose

### Com Docker Compose

```bash
docker-compose up -d
```

### Manualmente

```bash
# Instalar dependências
npm install

# Rodar migrations
npx prisma migrate deploy

# Rodar em desenvolvimento
npm run start:dev
```

---

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes unitários com watch
npm run test:watch

# Cobertura de testes
npm run test:cov

# Testes e2e
npm run test:e2e
```

---

## 📦 CI/CD

O projeto utiliza **GitHub Actions** com duas pipelines:

**Pull Request → `main`**
- Lint do código (`eslint`)
- Execução dos testes unitários

**Merge na `main`**
- Build da imagem Docker com **multistage** (otimizada para produção)
- Push automático para o **Docker Hub**

---

## 📁 Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run start:dev` | Inicia em modo desenvolvimento com watch |
| `npm run build` | Gera o build de produção |
| `npm run start:prod` | Roda migrations e inicia em produção |
| `npm run lint` | Lint com correção automática |
| `npm run test` | Executa testes unitários |
| `npm run test:cov` | Executa testes com cobertura |
| `npm run test:e2e` | Executa testes end-to-end |
