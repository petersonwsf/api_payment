import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      logger: ['error', 'warn', 'log'],
      rawBody: true,
    },
  );
  await app.listen(process.env.PORT ?? 3333, '0.0.0.0');
}
bootstrap().catch((err) => {
  console.log(err);
  process.exit(1);
});
