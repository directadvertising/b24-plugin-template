# Queues (RabbitMQ)

The stack uses **RabbitMQ 3.13** for background jobs — offloading Bitrix24 events
and slow work so request handlers stay responsive.

> Status: the queue is **not wired up yet**. `.env.example` carries the connection
> vars, but there is no `rabbitmq` service in `docker-compose.yml`, no `amqplib`
> dependency, and no worker. This doc is the pattern to follow when you add it.

## Environment

`.env` (from `.env.example`):

```
RABBITMQ_USER=queue_user
RABBITMQ_PASSWORD=queue_password
RABBITMQ_PORT=5672
RABBITMQ_MANAGEMENT_PORT=15672
```

Build the DSN from these (or add an explicit `RABBITMQ_DSN`):
`amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@rabbitmq:5672/`.

## Wiring it up

1. Add a `rabbitmq` service (image `rabbitmq:3.13-management-alpine`, ports
   `5672` + `15672`) to `docker-compose.yml`. Management UI:
   <http://localhost:15672>.
2. `pnpm --filter back-end add amqplib`.

## Client (`apps/back-end/src/queue/rabbitmq.ts`)

```ts
import amqp, { type Channel, type Connection } from "amqplib";

export class RabbitMQClient {
  private connection?: Connection;
  private channel?: Channel;

  async connect(url: string): Promise<Channel> {
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();
    return this.channel;
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}
```

## Publisher

```ts
import { RabbitMQClient } from "../queue/rabbitmq";

export async function publishEvent(
  queue: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const client = new RabbitMQClient();
  const channel = await client.connect(process.env.RABBITMQ_DSN!);

  await channel.assertQueue(queue, { durable: true });
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
  });

  await client.close();
}
```

## Consumer (worker)

```ts
import { RabbitMQClient } from "../queue/rabbitmq";

const QUEUE = "bitrix24.events";

async function bootstrap() {
  const client = new RabbitMQClient();
  const channel = await client.connect(process.env.RABBITMQ_DSN!);

  await channel.assertQueue(QUEUE, { durable: true });
  channel.prefetch(Number(process.env.RABBITMQ_PREFETCH ?? "5"));

  channel.consume(QUEUE, (message) => {
    if (!message) return;
    const payload = JSON.parse(message.content.toString());
    // TODO: handle the Bitrix24 event
    channel.ack(message);
  });
}

bootstrap().catch((err) => {
  console.error("Worker failed", err);
  process.exit(1);
});
```

Run the worker as its own long-lived process — a dedicated `docker compose`
service alongside `back-end`, not inside the API container.
