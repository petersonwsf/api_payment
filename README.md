<<<<<<< HEAD
# Service Payment

Este é um microsserviço de pagamentos para o sistema de hotelaria, construído com **NestJS**, **Fastify**, **Prisma ORM**, **Stripe** para processamento de pagamentos e **RabbitMQ** para mensageria assíncrona. O serviço gerencia a criação de intenções de pagamento, captura, reembolsos (refunds) e possui webhooks integrados ao Stripe para a confirmação de transações.

## 🚀 Tecnologias Utilizadas

- [NestJS](https://nestjs.com/)
- [Fastify](https://www.fastify.io/)
- [Prisma ORM](https://www.prisma.io/)
- [Stripe](https://stripe.com/br)
- [RabbitMQ](https://www.rabbitmq.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [Docker & Docker Compose](https://www.docker.com/)

---

## 🛠️ Como Executar o Projeto

Siga os passos abaixo para preparar e rodar o serviço em seu ambiente de desenvolvimento local.

### Pré-requisitos
- Node.js (v22+)
- Docker e Docker Compose
- Conta no Stripe (para chaves de API e Webhook)

### 1. Clonar e Instalar Dependências

```bash
# Acesse o diretório do projeto (caso já tenha clonado)
cd service_payment

# Instale as dependências via npm
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto baseado no template `.env.example`:

```env
PORT=3333
STRIPE_SECRET_KEY=sua_chave_secreta_do_stripe
DATABASE_URL=postgresql://root:root@localhost:5433/paymentService?schema=public
STRIPE_WEBHOOK_SECRET=sua_chave_secreta_webhook_do_stripe
SECRET_TOKEN=seu_jwt_secret
RABBITMQ_URL=amqp://admin:admin@localhost:5672
```

> **Aviso:** Nunca compartilhe suas chaves reais do Stripe ou senhas em ambientes públicos. Use chaves de teste para desenvolvimento.

### 3. Iniciar a Infraestrutura (Banco de Dados e Mensageria)

O projeto inclui um arquivo `docker-compose.yml` já pré-configurado com PostgreSQL e RabbitMQ. Para subi-los, execute:

```bash
docker-compose up -d
```

<<<<<<< HEAD
### 4. Aplicar Migrations do Prisma

Com a infraestrutura de banco de dados rodando, aplique as migrações para criar as tabelas necessárias:

```bash
npx prisma migrate dev
```

### 5. Iniciar o Servidor

Para iniciar a aplicação em modo de desenvolvimento (com hot-reload de arquivos):

```bash
npm run start:dev
```

O serviço estará rodando e escutando requisições na porta que você definiu no `.env` (ex: `http://localhost:3333`).

---

## 📚 Documentação da API (Endpoints)

Todas as requisições para a rota `/payment` necessitam de um cabeçalho de autenticação via **Bearer Token (JWT)**, exceto a rota do webhook.

### 1. Criar Intenção de Pagamento
Cria uma intenção de pagamento (PaymentIntent) na API do Stripe e salva o registro como pendente em nossa base de dados.

- **Rota:** `POST /payment`
- **Autenticação:** Requerida (`JWT`)
- **Body (JSON):**
  ```json
  {
    "reservationId": 123,
    "userId": 1,
    "amount": 150.00,
    "method": "CREDIT_CARD",
    "currency": "BRL",
    "customerEmail": "cliente@email.com"
  }
  ```
- **Retorno (201 Created):** Retorna o objeto completo do pagamento criado.
  ```json
  {
    "payment": {
      "id": "uuid-interno-do-pagamento",
      "reservationId": 123,
      "amount": 150.00,
      "status": "PENDING",
      "...": "outros campos"
    }
  }
  ```

### 2. Buscar Pagamento por ID
Retorna os detalhes de um pagamento específico pelo seu ID.

- **Rota:** `GET /payment/:id`
- **Autenticação:** Requerida (`JWT`)
- **Parâmetros de Rota:** `id` (ID do pagamento)
- **Retorno (200 OK):** Detalhes completos do pagamento solicitado.

### 3. Buscar Pagamentos por ID da Reserva
Retorna a lista/histórico de todos os pagamentos atrelados a uma reserva.

- **Rota:** `GET /payment/reservation/:reservationId`
- **Autenticação:** Requerida (`JWT`)
- **Parâmetros de Rota:** `reservationId` (ID da reserva)
- **Retorno (200 OK):** Array contendo as transações vinculadas à reserva.

### 4. Reembolsar (Refund) Pagamento
Solicita o reembolso de um pagamento já finalizado no Stripe e reflete as alterações no banco de dados.

- **Rota:** `DELETE /payment/:id`
- **Autenticação:** Requerida (`JWT`)
- **Parâmetros de Rota:** `id` (ID do pagamento)
- **Retorno (200 OK):** Objeto com os detalhes de confirmação de reembolso devolvidos pelo Stripe.

### 5. Capturar Pagamento
Realiza a captura de um pagamento (útil em fluxos de autorização prévia seguida de captura).

- **Rota:** `POST /payment/capture`
- **Autenticação:** Requerida (`JWT`)
- **Body (JSON):**
  ```json
  {
    "id": 123,
    "userId": 1,
    "amount": 150.00,
    "method": "CREDIT_CARD"
  }
  ```
- **Retorno (200 OK):** Confirmação de que a captura foi solicitada com sucesso.

### 6. Webhook do Stripe (Confirmação)
É uma rota utilizada exclusivamente pelo serviço da Stripe, e serve para atualizar a aplicação através de eventos assíncronos — por exemplo: confirmação de sucesso de um pagamento (Checkout Completo) ou erro na cobrança. O evento válido é jogado em uma fila do **RabbitMQ** para processamento posterior.

- **Rota:** `POST /webhook/confirm`
- **Autenticação:** Utiliza validação por assinatura do Stripe (Header `stripe-signature`)
- **Retorno (200 OK):**
  ```json
  {
    "received": true
  }
  ```