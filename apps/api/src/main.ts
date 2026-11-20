import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger/swagger.setup';
import { SWAGGER_PATH } from './swagger/swagger.constants';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  setupSwagger(app);

  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`GymFlow API running at http://localhost:${port}/api/v1`);
  console.log(
    `Swagger docs available at http://localhost:${port}/${SWAGGER_PATH}`,
  );
}

void bootstrap();
